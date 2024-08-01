var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @returns {(event: any) => any} */
	function prevent_default(fn) {
		return function (event) {
			event.preventDefault();
			// @ts-ignore
			return fn.call(this, event);
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data(text, data) {
		data = '' + data;
		if (text.data === data) return;
		text.data = /** @type {string} */ (data);
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, '');
		}
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	/** @returns {void} */
	function add_flush_callback(fn) {
		flush_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
			});
			block.o(local);
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function bind(component, name, callback) {
		const index = component.$$.props[name];
		if (index !== undefined) {
			component.$$.bound[index] = callback;
			callback(component.$$.ctx[index]);
		}
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	const PUBLIC_VERSION = '4';

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/* webviews/components/LedArray.svelte generated by Svelte v4.2.18 */

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[4] = list[i];
		child_ctx[6] = i;
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[7] = list[i];
		child_ctx[9] = i;
		return child_ctx;
	}

	// (33:4) {#each ledcolumn as led, j}
	function create_each_block_1(ctx) {
		let div;
		let t_value = (/*led*/ ctx[7] ? "" : "") + "";
		let t;

		return {
			c() {
				div = element("div");
				t = text(t_value);
				attr(div, "class", "led svelte-kzfv72");
				set_style(div, "background-color", "rgb(" + (/*r*/ ctx[0][/*i*/ ctx[6]][/*j*/ ctx[9]] === 1 ? 255 : 0) + ", " + (/*g*/ ctx[1][/*i*/ ctx[6]][/*j*/ ctx[9]] === 1 ? 255 : 0) + ", " + (/*b*/ ctx[2][/*i*/ ctx[6]][/*j*/ ctx[9]] === 1 ? 255 : 0) + ")");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				append(div, t);
			},
			p(ctx, dirty) {
				if (dirty & /*r*/ 1 && t_value !== (t_value = (/*led*/ ctx[7] ? "" : "") + "")) set_data(t, t_value);

				if (dirty & /*r, g, b*/ 7) {
					set_style(div, "background-color", "rgb(" + (/*r*/ ctx[0][/*i*/ ctx[6]][/*j*/ ctx[9]] === 1 ? 255 : 0) + ", " + (/*g*/ ctx[1][/*i*/ ctx[6]][/*j*/ ctx[9]] === 1 ? 255 : 0) + ", " + (/*b*/ ctx[2][/*i*/ ctx[6]][/*j*/ ctx[9]] === 1 ? 255 : 0) + ")");
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (31:0) {#each r as ledcolumn, i}
	function create_each_block$1(ctx) {
		let div;
		let t;
		let each_value_1 = ensure_array_like(/*ledcolumn*/ ctx[4]);
		let each_blocks = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		return {
			c() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t = space();
				attr(div, "class", "led-row svelte-kzfv72");
			},
			m(target, anchor) {
				insert(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}

				append(div, t);
			},
			p(ctx, dirty) {
				if (dirty & /*r, g, b*/ 7) {
					each_value_1 = ensure_array_like(/*ledcolumn*/ ctx[4]);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div, t);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_1.length;
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function create_fragment$6(ctx) {
		let each_1_anchor;
		let each_value = ensure_array_like(/*r*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		return {
			c() {
				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},
			m(target, anchor) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert(target, each_1_anchor, anchor);
			},
			p(ctx, [dirty]) {
				if (dirty & /*r, g, b*/ 7) {
					each_value = ensure_array_like(/*r*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	const width = 12;
	const height = 10;

	function instance$6($$self, $$props, $$invalidate) {
		let { ledArray = {
			r: Array.from({ length: height }, () => 0),
			g: Array.from({ length: height }, () => 0),
			b: Array.from({ length: height }, () => 0)
		} } = $$props;

		let r;
		let g;
		let b;

		$$self.$$set = $$props => {
			if ('ledArray' in $$props) $$invalidate(3, ledArray = $$props.ledArray);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*ledArray*/ 8) {
				{
					$$invalidate(0, r = Array.from({ length: width }, (_, widx) => Array.from({ length: height }, (_, hidx) => {
						if (!ledArray.r) return 0;
						return (ledArray.r[hidx] & 1 << widx) > 0 ? 1 : 0;
					})));

					$$invalidate(1, g = Array.from({ length: width }, (_, widx) => Array.from({ length: height }, (_, hidx) => {
						if (!ledArray.g) return 0;
						return (ledArray.g[hidx] & 1 << widx) > 0 ? 1 : 0;
					})));

					$$invalidate(2, b = Array.from({ length: width }, (_, widx) => Array.from({ length: height }, (_, hidx) => {
						if (!ledArray.b) return 0;
						return (ledArray.b[hidx] & 1 << widx) > 0 ? 1 : 0;
					})));
				}
			}
		};

		return [r, g, b, ledArray];
	}

	class LedArray extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$6, create_fragment$6, safe_not_equal, { ledArray: 3 });
		}
	}

	/* webviews/components/SevenSegment.svelte generated by Svelte v4.2.18 */

	function create_fragment$5(ctx) {
		let div8;
		let div0;
		let t0;
		let div1;
		let t1;
		let div2;
		let t2;
		let div3;
		let t3;
		let div4;
		let t4;
		let div5;
		let t5;
		let div6;
		let t6;
		let div7;

		return {
			c() {
				div8 = element("div");
				div0 = element("div");
				div0.innerHTML = `<span class="segment-border svelte-10pn0k3"></span>`;
				t0 = space();
				div1 = element("div");
				div1.innerHTML = `<span class="segment-border svelte-10pn0k3"></span>`;
				t1 = space();
				div2 = element("div");
				div2.innerHTML = `<span class="segment-border svelte-10pn0k3"></span>`;
				t2 = space();
				div3 = element("div");
				div3.innerHTML = `<span class="segment-border svelte-10pn0k3"></span>`;
				t3 = space();
				div4 = element("div");
				div4.innerHTML = `<span class="segment-border svelte-10pn0k3"></span>`;
				t4 = space();
				div5 = element("div");
				div5.innerHTML = `<span class="segment-border svelte-10pn0k3"></span>`;
				t5 = space();
				div6 = element("div");
				div6.innerHTML = `<span class="segment-border svelte-10pn0k3"></span>`;
				t6 = space();
				div7 = element("div");
				attr(div0, "class", "segment-x segment-a svelte-10pn0k3");
				toggle_class(div0, "active", /*value*/ ctx[0] % 2 == 1);
				attr(div1, "class", "segment-y segment-b svelte-10pn0k3");
				toggle_class(div1, "active", Math.floor(/*value*/ ctx[0] / 2 % 2) == 1);
				attr(div2, "class", "segment-y segment-c svelte-10pn0k3");
				toggle_class(div2, "active", Math.floor(/*value*/ ctx[0] / 4 % 2) == 1);
				attr(div3, "class", "segment-x segment-d svelte-10pn0k3");
				toggle_class(div3, "active", Math.floor(/*value*/ ctx[0] / 8 % 2) == 1);
				attr(div4, "class", "segment-y segment-e svelte-10pn0k3");
				toggle_class(div4, "active", Math.floor(/*value*/ ctx[0] / 16 % 2) == 1);
				attr(div5, "class", "segment-y segment-f svelte-10pn0k3");
				toggle_class(div5, "active", Math.floor(/*value*/ ctx[0] / 32 % 2) == 1);
				attr(div6, "class", "segment-x segment-g svelte-10pn0k3");
				toggle_class(div6, "active", Math.floor(/*value*/ ctx[0] / 64 % 2) == 1);
				attr(div7, "class", "dot svelte-10pn0k3");
				toggle_class(div7, "active", Math.floor(/*value*/ ctx[0] / 128 % 2) == 1);
				attr(div8, "class", "display-container display-size-12 svelte-10pn0k3");
			},
			m(target, anchor) {
				insert(target, div8, anchor);
				append(div8, div0);
				append(div8, t0);
				append(div8, div1);
				append(div8, t1);
				append(div8, div2);
				append(div8, t2);
				append(div8, div3);
				append(div8, t3);
				append(div8, div4);
				append(div8, t4);
				append(div8, div5);
				append(div8, t5);
				append(div8, div6);
				append(div8, t6);
				append(div8, div7);
			},
			p(ctx, [dirty]) {
				if (dirty & /*value*/ 1) {
					toggle_class(div0, "active", /*value*/ ctx[0] % 2 == 1);
				}

				if (dirty & /*Math, value*/ 1) {
					toggle_class(div1, "active", Math.floor(/*value*/ ctx[0] / 2 % 2) == 1);
				}

				if (dirty & /*Math, value*/ 1) {
					toggle_class(div2, "active", Math.floor(/*value*/ ctx[0] / 4 % 2) == 1);
				}

				if (dirty & /*Math, value*/ 1) {
					toggle_class(div3, "active", Math.floor(/*value*/ ctx[0] / 8 % 2) == 1);
				}

				if (dirty & /*Math, value*/ 1) {
					toggle_class(div4, "active", Math.floor(/*value*/ ctx[0] / 16 % 2) == 1);
				}

				if (dirty & /*Math, value*/ 1) {
					toggle_class(div5, "active", Math.floor(/*value*/ ctx[0] / 32 % 2) == 1);
				}

				if (dirty & /*Math, value*/ 1) {
					toggle_class(div6, "active", Math.floor(/*value*/ ctx[0] / 64 % 2) == 1);
				}

				if (dirty & /*Math, value*/ 1) {
					toggle_class(div7, "active", Math.floor(/*value*/ ctx[0] / 128 % 2) == 1);
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div8);
				}
			}
		};
	}

	function instance$5($$self, $$props, $$invalidate) {
		let { value = 0 } = $$props;

		$$self.$$set = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
		};

		return [value];
	}

	class SevenSegment extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { value: 0 });
		}
	}

	/* webviews/components/SevenSegmentArray.svelte generated by Svelte v4.2.18 */

	function create_fragment$4(ctx) {
		let div;
		let sevensegment0;
		let t0;
		let sevensegment1;
		let t1;
		let sevensegment2;
		let t2;
		let sevensegment3;
		let current;
		sevensegment0 = new SevenSegment({ props: { value: /*three*/ ctx[3] } });
		sevensegment1 = new SevenSegment({ props: { value: /*two*/ ctx[2] } });
		sevensegment2 = new SevenSegment({ props: { value: /*one*/ ctx[1] } });
		sevensegment3 = new SevenSegment({ props: { value: /*zero*/ ctx[0] } });

		return {
			c() {
				div = element("div");
				create_component(sevensegment0.$$.fragment);
				t0 = space();
				create_component(sevensegment1.$$.fragment);
				t1 = space();
				create_component(sevensegment2.$$.fragment);
				t2 = space();
				create_component(sevensegment3.$$.fragment);
				attr(div, "class", "SevenSegments svelte-hwq4hp");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				mount_component(sevensegment0, div, null);
				append(div, t0);
				mount_component(sevensegment1, div, null);
				append(div, t1);
				mount_component(sevensegment2, div, null);
				append(div, t2);
				mount_component(sevensegment3, div, null);
				current = true;
			},
			p(ctx, [dirty]) {
				const sevensegment0_changes = {};
				if (dirty & /*three*/ 8) sevensegment0_changes.value = /*three*/ ctx[3];
				sevensegment0.$set(sevensegment0_changes);
				const sevensegment1_changes = {};
				if (dirty & /*two*/ 4) sevensegment1_changes.value = /*two*/ ctx[2];
				sevensegment1.$set(sevensegment1_changes);
				const sevensegment2_changes = {};
				if (dirty & /*one*/ 2) sevensegment2_changes.value = /*one*/ ctx[1];
				sevensegment2.$set(sevensegment2_changes);
				const sevensegment3_changes = {};
				if (dirty & /*zero*/ 1) sevensegment3_changes.value = /*zero*/ ctx[0];
				sevensegment3.$set(sevensegment3_changes);
			},
			i(local) {
				if (current) return;
				transition_in(sevensegment0.$$.fragment, local);
				transition_in(sevensegment1.$$.fragment, local);
				transition_in(sevensegment2.$$.fragment, local);
				transition_in(sevensegment3.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(sevensegment0.$$.fragment, local);
				transition_out(sevensegment1.$$.fragment, local);
				transition_out(sevensegment2.$$.fragment, local);
				transition_out(sevensegment3.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_component(sevensegment0);
				destroy_component(sevensegment1);
				destroy_component(sevensegment2);
				destroy_component(sevensegment3);
			}
		};
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { zero = 0 } = $$props;
		let { one = 0 } = $$props;
		let { two = 0 } = $$props;
		let { three = 0 } = $$props;

		$$self.$$set = $$props => {
			if ('zero' in $$props) $$invalidate(0, zero = $$props.zero);
			if ('one' in $$props) $$invalidate(1, one = $$props.one);
			if ('two' in $$props) $$invalidate(2, two = $$props.two);
			if ('three' in $$props) $$invalidate(3, three = $$props.three);
		};

		return [zero, one, two, three];
	}

	class SevenSegmentArray extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { zero: 0, one: 1, two: 2, three: 3 });
		}
	}

	/* webviews/components/pushButton.svelte generated by Svelte v4.2.18 */

	function create_fragment$3(ctx) {
		let button;
		let mounted;
		let dispose;

		return {
			c() {
				button = element("button");
				attr(button, "class", "pushButtons svelte-cvmel5");
				set_style(button, "width", /*size*/ ctx[1] + "px");
				set_style(button, "height", /*size*/ ctx[1] + "px");
				set_style(button, "margin", /*margin*/ ctx[2] + "px");
				toggle_class(button, "active", /*value*/ ctx[0]);
			},
			m(target, anchor) {
				insert(target, button, anchor);

				if (!mounted) {
					dispose = [
						listen(button, "mousedown", prevent_default(/*mousedown_handler*/ ctx[3])),
						listen(button, "mouseup", prevent_default(/*mouseup_handler*/ ctx[4])),
						listen(button, "mouseleave", prevent_default(/*mouseleave_handler*/ ctx[5]))
					];

					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*size*/ 2) {
					set_style(button, "width", /*size*/ ctx[1] + "px");
				}

				if (dirty & /*size*/ 2) {
					set_style(button, "height", /*size*/ ctx[1] + "px");
				}

				if (dirty & /*margin*/ 4) {
					set_style(button, "margin", /*margin*/ ctx[2] + "px");
				}

				if (dirty & /*value*/ 1) {
					toggle_class(button, "active", /*value*/ ctx[0]);
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(button);
				}

				mounted = false;
				run_all(dispose);
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { value = false } = $$props;
		let { size = 50 } = $$props;
		let { margin = 10 } = $$props;

		const mousedown_handler = () => {
			$$invalidate(0, value = true);
		};

		const mouseup_handler = () => {
			$$invalidate(0, value = false);
		};

		const mouseleave_handler = () => {
			$$invalidate(0, value = false);
		};

		$$self.$$set = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
			if ('size' in $$props) $$invalidate(1, size = $$props.size);
			if ('margin' in $$props) $$invalidate(2, margin = $$props.margin);
		};

		return [value, size, margin, mousedown_handler, mouseup_handler, mouseleave_handler];
	}

	class PushButton extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$3, create_fragment$3, safe_not_equal, { value: 0, size: 1, margin: 2 });
		}
	}

	/* webviews/components/dipSwitches.svelte generated by Svelte v4.2.18 */

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[3] = list[i];
		child_ctx[4] = list;
		child_ctx[5] = i;
		return child_ctx;
	}

	// (20:2) {#each switches as switchValue, idx}
	function create_each_block(ctx) {
		let div;
		let span1;
		let t0;
		let span2;
		let t2;
		let mounted;
		let dispose;

		function click_handler() {
			return /*click_handler*/ ctx[2](/*switchValue*/ ctx[3], /*each_value*/ ctx[4], /*idx*/ ctx[5]);
		}

		return {
			c() {
				div = element("div");
				span1 = element("span");
				span1.innerHTML = `<span class="knob svelte-1qbrvz9"></span>`;
				t0 = space();
				span2 = element("span");
				span2.textContent = `${/*idx*/ ctx[5] + 1}`;
				t2 = space();
				attr(span1, "class", "switch svelte-1qbrvz9");
				toggle_class(span1, "on", /*switchValue*/ ctx[3]);
				attr(span2, "class", "symbol svelte-1qbrvz9");
				attr(div, "class", "item svelte-1qbrvz9");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				append(div, span1);
				append(div, t0);
				append(div, span2);
				append(div, t2);

				if (!mounted) {
					dispose = listen(span1, "click", click_handler);
					mounted = true;
				}
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;

				if (dirty & /*switches*/ 1) {
					toggle_class(span1, "on", /*switchValue*/ ctx[3]);
				}
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				mounted = false;
				dispose();
			}
		};
	}

	function create_fragment$2(ctx) {
		let div;
		let each_value = ensure_array_like(/*switches*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		return {
			c() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(div, "class", "dipswitch svelte-1qbrvz9");
			},
			m(target, anchor) {
				insert(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*switches*/ 1) {
					each_value = ensure_array_like(/*switches*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { value = 0 } = $$props;
		let switches = [false, false, false, false, false, false, false, false];

		const click_handler = (switchValue, each_value, idx) => {
			$$invalidate(0, each_value[idx] = !switchValue, switches);
		};

		$$self.$$set = $$props => {
			if ('value' in $$props) $$invalidate(1, value = $$props.value);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*switches*/ 1) {
				{
					$$invalidate(1, value = switches.reduce(
						(acc, val, idx) => {
							return acc + (val ? 1 << 7 - idx : 0);
						},
						0
					));
				}
			}
		};

		return [switches, value, click_handler];
	}

	class DipSwitches extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 1 });
		}
	}

	/* webviews/components/JoyStick.svelte generated by Svelte v4.2.18 */

	function create_fragment$1(ctx) {
		let div3;
		let div0;
		let pushbutton0;
		let updating_value;
		let t0;
		let div1;
		let pushbutton1;
		let updating_value_1;
		let t1;
		let pushbutton2;
		let updating_value_2;
		let t2;
		let pushbutton3;
		let updating_value_3;
		let t3;
		let div2;
		let pushbutton4;
		let updating_value_4;
		let current;

		function pushbutton0_value_binding(value) {
			/*pushbutton0_value_binding*/ ctx[1](value);
		}

		let pushbutton0_props = { size: 25, margin: 0 };

		if (/*joystick*/ ctx[0].up !== void 0) {
			pushbutton0_props.value = /*joystick*/ ctx[0].up;
		}

		pushbutton0 = new PushButton({ props: pushbutton0_props });
		binding_callbacks.push(() => bind(pushbutton0, 'value', pushbutton0_value_binding));

		function pushbutton1_value_binding(value) {
			/*pushbutton1_value_binding*/ ctx[2](value);
		}

		let pushbutton1_props = { size: 25, margin: 0 };

		if (/*joystick*/ ctx[0].left !== void 0) {
			pushbutton1_props.value = /*joystick*/ ctx[0].left;
		}

		pushbutton1 = new PushButton({ props: pushbutton1_props });
		binding_callbacks.push(() => bind(pushbutton1, 'value', pushbutton1_value_binding));

		function pushbutton2_value_binding(value) {
			/*pushbutton2_value_binding*/ ctx[3](value);
		}

		let pushbutton2_props = { size: 25, margin: 0 };

		if (/*joystick*/ ctx[0].pressed !== void 0) {
			pushbutton2_props.value = /*joystick*/ ctx[0].pressed;
		}

		pushbutton2 = new PushButton({ props: pushbutton2_props });
		binding_callbacks.push(() => bind(pushbutton2, 'value', pushbutton2_value_binding));

		function pushbutton3_value_binding(value) {
			/*pushbutton3_value_binding*/ ctx[4](value);
		}

		let pushbutton3_props = { size: 25, margin: 0 };

		if (/*joystick*/ ctx[0].right !== void 0) {
			pushbutton3_props.value = /*joystick*/ ctx[0].right;
		}

		pushbutton3 = new PushButton({ props: pushbutton3_props });
		binding_callbacks.push(() => bind(pushbutton3, 'value', pushbutton3_value_binding));

		function pushbutton4_value_binding(value) {
			/*pushbutton4_value_binding*/ ctx[5](value);
		}

		let pushbutton4_props = { size: 25, margin: 0 };

		if (/*joystick*/ ctx[0].down !== void 0) {
			pushbutton4_props.value = /*joystick*/ ctx[0].down;
		}

		pushbutton4 = new PushButton({ props: pushbutton4_props });
		binding_callbacks.push(() => bind(pushbutton4, 'value', pushbutton4_value_binding));

		return {
			c() {
				div3 = element("div");
				div0 = element("div");
				create_component(pushbutton0.$$.fragment);
				t0 = space();
				div1 = element("div");
				create_component(pushbutton1.$$.fragment);
				t1 = space();
				create_component(pushbutton2.$$.fragment);
				t2 = space();
				create_component(pushbutton3.$$.fragment);
				t3 = space();
				div2 = element("div");
				create_component(pushbutton4.$$.fragment);
				attr(div0, "class", "controler top svelte-kk3q2a");
				attr(div1, "class", "controler middle svelte-kk3q2a");
				attr(div2, "class", "controler bottom svelte-kk3q2a");
				attr(div3, "class", "joystick svelte-kk3q2a");
			},
			m(target, anchor) {
				insert(target, div3, anchor);
				append(div3, div0);
				mount_component(pushbutton0, div0, null);
				append(div3, t0);
				append(div3, div1);
				mount_component(pushbutton1, div1, null);
				append(div1, t1);
				mount_component(pushbutton2, div1, null);
				append(div1, t2);
				mount_component(pushbutton3, div1, null);
				append(div3, t3);
				append(div3, div2);
				mount_component(pushbutton4, div2, null);
				current = true;
			},
			p(ctx, [dirty]) {
				const pushbutton0_changes = {};

				if (!updating_value && dirty & /*joystick*/ 1) {
					updating_value = true;
					pushbutton0_changes.value = /*joystick*/ ctx[0].up;
					add_flush_callback(() => updating_value = false);
				}

				pushbutton0.$set(pushbutton0_changes);
				const pushbutton1_changes = {};

				if (!updating_value_1 && dirty & /*joystick*/ 1) {
					updating_value_1 = true;
					pushbutton1_changes.value = /*joystick*/ ctx[0].left;
					add_flush_callback(() => updating_value_1 = false);
				}

				pushbutton1.$set(pushbutton1_changes);
				const pushbutton2_changes = {};

				if (!updating_value_2 && dirty & /*joystick*/ 1) {
					updating_value_2 = true;
					pushbutton2_changes.value = /*joystick*/ ctx[0].pressed;
					add_flush_callback(() => updating_value_2 = false);
				}

				pushbutton2.$set(pushbutton2_changes);
				const pushbutton3_changes = {};

				if (!updating_value_3 && dirty & /*joystick*/ 1) {
					updating_value_3 = true;
					pushbutton3_changes.value = /*joystick*/ ctx[0].right;
					add_flush_callback(() => updating_value_3 = false);
				}

				pushbutton3.$set(pushbutton3_changes);
				const pushbutton4_changes = {};

				if (!updating_value_4 && dirty & /*joystick*/ 1) {
					updating_value_4 = true;
					pushbutton4_changes.value = /*joystick*/ ctx[0].down;
					add_flush_callback(() => updating_value_4 = false);
				}

				pushbutton4.$set(pushbutton4_changes);
			},
			i(local) {
				if (current) return;
				transition_in(pushbutton0.$$.fragment, local);
				transition_in(pushbutton1.$$.fragment, local);
				transition_in(pushbutton2.$$.fragment, local);
				transition_in(pushbutton3.$$.fragment, local);
				transition_in(pushbutton4.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(pushbutton0.$$.fragment, local);
				transition_out(pushbutton1.$$.fragment, local);
				transition_out(pushbutton2.$$.fragment, local);
				transition_out(pushbutton3.$$.fragment, local);
				transition_out(pushbutton4.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div3);
				}

				destroy_component(pushbutton0);
				destroy_component(pushbutton1);
				destroy_component(pushbutton2);
				destroy_component(pushbutton3);
				destroy_component(pushbutton4);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { joystick = {} } = $$props;

		function pushbutton0_value_binding(value) {
			if ($$self.$$.not_equal(joystick.up, value)) {
				joystick.up = value;
				$$invalidate(0, joystick);
			}
		}

		function pushbutton1_value_binding(value) {
			if ($$self.$$.not_equal(joystick.left, value)) {
				joystick.left = value;
				$$invalidate(0, joystick);
			}
		}

		function pushbutton2_value_binding(value) {
			if ($$self.$$.not_equal(joystick.pressed, value)) {
				joystick.pressed = value;
				$$invalidate(0, joystick);
			}
		}

		function pushbutton3_value_binding(value) {
			if ($$self.$$.not_equal(joystick.right, value)) {
				joystick.right = value;
				$$invalidate(0, joystick);
			}
		}

		function pushbutton4_value_binding(value) {
			if ($$self.$$.not_equal(joystick.down, value)) {
				joystick.down = value;
				$$invalidate(0, joystick);
			}
		}

		$$self.$$set = $$props => {
			if ('joystick' in $$props) $$invalidate(0, joystick = $$props.joystick);
		};

		return [
			joystick,
			pushbutton0_value_binding,
			pushbutton1_value_binding,
			pushbutton2_value_binding,
			pushbutton3_value_binding,
			pushbutton4_value_binding
		];
	}

	class JoyStick extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$1, create_fragment$1, safe_not_equal, { joystick: 0 });
		}
	}

	/* webviews/components/Application.svelte generated by Svelte v4.2.18 */

	function create_fragment(ctx) {
		let sevensegmentarray;
		let t0;
		let div1;
		let ledarray;
		let t1;
		let div0;
		let pushbutton0;
		let updating_value;
		let t2;
		let pushbutton1;
		let updating_value_1;
		let t3;
		let div2;
		let dipswitches;
		let updating_value_2;
		let t4;
		let pushbutton2;
		let updating_value_3;
		let t5;
		let pushbutton3;
		let updating_value_4;
		let t6;
		let pushbutton4;
		let updating_value_5;
		let t7;
		let joystick_1;
		let updating_joystick;
		let current;

		sevensegmentarray = new SevenSegmentArray({
				props: {
					zero: /*sevenSegment*/ ctx[4].zero,
					one: /*sevenSegment*/ ctx[4].one,
					two: /*sevenSegment*/ ctx[4].two,
					three: /*sevenSegment*/ ctx[4].three
				}
			});

		ledarray = new LedArray({ props: { ledArray: /*ledArray*/ ctx[3] } });

		function pushbutton0_value_binding(value) {
			/*pushbutton0_value_binding*/ ctx[5](value);
		}

		let pushbutton0_props = {};

		if (/*button*/ ctx[0].top !== void 0) {
			pushbutton0_props.value = /*button*/ ctx[0].top;
		}

		pushbutton0 = new PushButton({ props: pushbutton0_props });
		binding_callbacks.push(() => bind(pushbutton0, 'value', pushbutton0_value_binding));

		function pushbutton1_value_binding(value) {
			/*pushbutton1_value_binding*/ ctx[6](value);
		}

		let pushbutton1_props = {};

		if (/*button*/ ctx[0].bottom !== void 0) {
			pushbutton1_props.value = /*button*/ ctx[0].bottom;
		}

		pushbutton1 = new PushButton({ props: pushbutton1_props });
		binding_callbacks.push(() => bind(pushbutton1, 'value', pushbutton1_value_binding));

		function dipswitches_value_binding(value) {
			/*dipswitches_value_binding*/ ctx[7](value);
		}

		let dipswitches_props = {};

		if (/*dip_switches*/ ctx[2] !== void 0) {
			dipswitches_props.value = /*dip_switches*/ ctx[2];
		}

		dipswitches = new DipSwitches({ props: dipswitches_props });
		binding_callbacks.push(() => bind(dipswitches, 'value', dipswitches_value_binding));

		function pushbutton2_value_binding(value) {
			/*pushbutton2_value_binding*/ ctx[8](value);
		}

		let pushbutton2_props = {};

		if (/*button*/ ctx[0].left !== void 0) {
			pushbutton2_props.value = /*button*/ ctx[0].left;
		}

		pushbutton2 = new PushButton({ props: pushbutton2_props });
		binding_callbacks.push(() => bind(pushbutton2, 'value', pushbutton2_value_binding));

		function pushbutton3_value_binding(value) {
			/*pushbutton3_value_binding*/ ctx[9](value);
		}

		let pushbutton3_props = {};

		if (/*button*/ ctx[0].center !== void 0) {
			pushbutton3_props.value = /*button*/ ctx[0].center;
		}

		pushbutton3 = new PushButton({ props: pushbutton3_props });
		binding_callbacks.push(() => bind(pushbutton3, 'value', pushbutton3_value_binding));

		function pushbutton4_value_binding(value) {
			/*pushbutton4_value_binding*/ ctx[10](value);
		}

		let pushbutton4_props = {};

		if (/*button*/ ctx[0].right !== void 0) {
			pushbutton4_props.value = /*button*/ ctx[0].right;
		}

		pushbutton4 = new PushButton({ props: pushbutton4_props });
		binding_callbacks.push(() => bind(pushbutton4, 'value', pushbutton4_value_binding));

		function joystick_1_joystick_binding(value) {
			/*joystick_1_joystick_binding*/ ctx[11](value);
		}

		let joystick_1_props = {};

		if (/*joystick*/ ctx[1] !== void 0) {
			joystick_1_props.joystick = /*joystick*/ ctx[1];
		}

		joystick_1 = new JoyStick({ props: joystick_1_props });
		binding_callbacks.push(() => bind(joystick_1, 'joystick', joystick_1_joystick_binding));

		return {
			c() {
				create_component(sevensegmentarray.$$.fragment);
				t0 = space();
				div1 = element("div");
				create_component(ledarray.$$.fragment);
				t1 = space();
				div0 = element("div");
				create_component(pushbutton0.$$.fragment);
				t2 = space();
				create_component(pushbutton1.$$.fragment);
				t3 = space();
				div2 = element("div");
				create_component(dipswitches.$$.fragment);
				t4 = space();
				create_component(pushbutton2.$$.fragment);
				t5 = space();
				create_component(pushbutton3.$$.fragment);
				t6 = space();
				create_component(pushbutton4.$$.fragment);
				t7 = space();
				create_component(joystick_1.$$.fragment);
				attr(div0, "class", "rightButtons svelte-85fdla");
				attr(div1, "class", "ledArrRow svelte-85fdla");
				attr(div2, "class", "dipSwitchRow svelte-85fdla");
			},
			m(target, anchor) {
				mount_component(sevensegmentarray, target, anchor);
				insert(target, t0, anchor);
				insert(target, div1, anchor);
				mount_component(ledarray, div1, null);
				append(div1, t1);
				append(div1, div0);
				mount_component(pushbutton0, div0, null);
				append(div0, t2);
				mount_component(pushbutton1, div0, null);
				insert(target, t3, anchor);
				insert(target, div2, anchor);
				mount_component(dipswitches, div2, null);
				append(div2, t4);
				mount_component(pushbutton2, div2, null);
				append(div2, t5);
				mount_component(pushbutton3, div2, null);
				append(div2, t6);
				mount_component(pushbutton4, div2, null);
				append(div2, t7);
				mount_component(joystick_1, div2, null);
				current = true;
			},
			p(ctx, [dirty]) {
				const sevensegmentarray_changes = {};
				if (dirty & /*sevenSegment*/ 16) sevensegmentarray_changes.zero = /*sevenSegment*/ ctx[4].zero;
				if (dirty & /*sevenSegment*/ 16) sevensegmentarray_changes.one = /*sevenSegment*/ ctx[4].one;
				if (dirty & /*sevenSegment*/ 16) sevensegmentarray_changes.two = /*sevenSegment*/ ctx[4].two;
				if (dirty & /*sevenSegment*/ 16) sevensegmentarray_changes.three = /*sevenSegment*/ ctx[4].three;
				sevensegmentarray.$set(sevensegmentarray_changes);
				const ledarray_changes = {};
				if (dirty & /*ledArray*/ 8) ledarray_changes.ledArray = /*ledArray*/ ctx[3];
				ledarray.$set(ledarray_changes);
				const pushbutton0_changes = {};

				if (!updating_value && dirty & /*button*/ 1) {
					updating_value = true;
					pushbutton0_changes.value = /*button*/ ctx[0].top;
					add_flush_callback(() => updating_value = false);
				}

				pushbutton0.$set(pushbutton0_changes);
				const pushbutton1_changes = {};

				if (!updating_value_1 && dirty & /*button*/ 1) {
					updating_value_1 = true;
					pushbutton1_changes.value = /*button*/ ctx[0].bottom;
					add_flush_callback(() => updating_value_1 = false);
				}

				pushbutton1.$set(pushbutton1_changes);
				const dipswitches_changes = {};

				if (!updating_value_2 && dirty & /*dip_switches*/ 4) {
					updating_value_2 = true;
					dipswitches_changes.value = /*dip_switches*/ ctx[2];
					add_flush_callback(() => updating_value_2 = false);
				}

				dipswitches.$set(dipswitches_changes);
				const pushbutton2_changes = {};

				if (!updating_value_3 && dirty & /*button*/ 1) {
					updating_value_3 = true;
					pushbutton2_changes.value = /*button*/ ctx[0].left;
					add_flush_callback(() => updating_value_3 = false);
				}

				pushbutton2.$set(pushbutton2_changes);
				const pushbutton3_changes = {};

				if (!updating_value_4 && dirty & /*button*/ 1) {
					updating_value_4 = true;
					pushbutton3_changes.value = /*button*/ ctx[0].center;
					add_flush_callback(() => updating_value_4 = false);
				}

				pushbutton3.$set(pushbutton3_changes);
				const pushbutton4_changes = {};

				if (!updating_value_5 && dirty & /*button*/ 1) {
					updating_value_5 = true;
					pushbutton4_changes.value = /*button*/ ctx[0].right;
					add_flush_callback(() => updating_value_5 = false);
				}

				pushbutton4.$set(pushbutton4_changes);
				const joystick_1_changes = {};

				if (!updating_joystick && dirty & /*joystick*/ 2) {
					updating_joystick = true;
					joystick_1_changes.joystick = /*joystick*/ ctx[1];
					add_flush_callback(() => updating_joystick = false);
				}

				joystick_1.$set(joystick_1_changes);
			},
			i(local) {
				if (current) return;
				transition_in(sevensegmentarray.$$.fragment, local);
				transition_in(ledarray.$$.fragment, local);
				transition_in(pushbutton0.$$.fragment, local);
				transition_in(pushbutton1.$$.fragment, local);
				transition_in(dipswitches.$$.fragment, local);
				transition_in(pushbutton2.$$.fragment, local);
				transition_in(pushbutton3.$$.fragment, local);
				transition_in(pushbutton4.$$.fragment, local);
				transition_in(joystick_1.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(sevensegmentarray.$$.fragment, local);
				transition_out(ledarray.$$.fragment, local);
				transition_out(pushbutton0.$$.fragment, local);
				transition_out(pushbutton1.$$.fragment, local);
				transition_out(dipswitches.$$.fragment, local);
				transition_out(pushbutton2.$$.fragment, local);
				transition_out(pushbutton3.$$.fragment, local);
				transition_out(pushbutton4.$$.fragment, local);
				transition_out(joystick_1.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(t0);
					detach(div1);
					detach(t3);
					detach(div2);
				}

				destroy_component(sevensegmentarray, detaching);
				destroy_component(ledarray);
				destroy_component(pushbutton0);
				destroy_component(pushbutton1);
				destroy_component(dipswitches);
				destroy_component(pushbutton2);
				destroy_component(pushbutton3);
				destroy_component(pushbutton4);
				destroy_component(joystick_1);
			}
		};
	}

	function changeInput(button, joystick, dip_switches) {
		let args = { button, joystick, dip_switches };
		tsvscode.postMessage({ command: "updateInput", arguments: args });
	}

	function instance($$self, $$props, $$invalidate) {
		let ledArray = {};
		let sevenSegment = {};
		let button = {};
		let joystick = {};
		let dip_switches = 0;

		onMount(() => {
			window.addEventListener("message", event => {
				const message = event.data;
				console.log(message);

				if (message.type === "boardUpdate") {
					// parse the body of the message
					const data = message.body;

					$$invalidate(3, ledArray = data.ledArray);
					$$invalidate(4, sevenSegment = data.sevenSegment);
					console.log(data);
				}
			});
		});

		function pushbutton0_value_binding(value) {
			if ($$self.$$.not_equal(button.top, value)) {
				button.top = value;
				$$invalidate(0, button);
			}
		}

		function pushbutton1_value_binding(value) {
			if ($$self.$$.not_equal(button.bottom, value)) {
				button.bottom = value;
				$$invalidate(0, button);
			}
		}

		function dipswitches_value_binding(value) {
			dip_switches = value;
			$$invalidate(2, dip_switches);
		}

		function pushbutton2_value_binding(value) {
			if ($$self.$$.not_equal(button.left, value)) {
				button.left = value;
				$$invalidate(0, button);
			}
		}

		function pushbutton3_value_binding(value) {
			if ($$self.$$.not_equal(button.center, value)) {
				button.center = value;
				$$invalidate(0, button);
			}
		}

		function pushbutton4_value_binding(value) {
			if ($$self.$$.not_equal(button.right, value)) {
				button.right = value;
				$$invalidate(0, button);
			}
		}

		function joystick_1_joystick_binding(value) {
			joystick = value;
			$$invalidate(1, joystick);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*button, joystick, dip_switches*/ 7) {
				{
					changeInput(button, joystick, dip_switches);
				}
			}
		};

		return [
			button,
			joystick,
			dip_switches,
			ledArray,
			sevenSegment,
			pushbutton0_value_binding,
			pushbutton1_value_binding,
			dipswitches_value_binding,
			pushbutton2_value_binding,
			pushbutton3_value_binding,
			pushbutton4_value_binding,
			joystick_1_joystick_binding
		];
	}

	class Application extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance, create_fragment, safe_not_equal, {});
		}
	}

	const app = new Application({
	    target: document.body,
	});

	return app;

})();
//# sourceMappingURL=main.js.map
