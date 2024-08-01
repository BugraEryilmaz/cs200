module tb (
        input        clk,
        input        rst_n,
        output reg [7:0] sevensegment_2,
        output reg [119:0] led_r,
        output reg [119:0] led_g,
        input button_top,
        input button_bottom,
        input button_left,
        input button_right,
        input button_center,
        input [7:0] dip_switches,
        input joystick_up,
        input joystick_down,
        input joystick_left,
        input joystick_right,
        input joystick_pressed
    );
    

    always @(posedge clk) begin
        if (rst_n == 0) begin 
            sevensegment_2 <= 0;  
            led_r <= 0; 
            led_g <= 0; 
         end
        else begin
            led_g[7:0] <= dip_switches;
            sevensegment_2[0] <= button_top;
            sevensegment_2[1] <= button_bottom;
            sevensegment_2[2] <= button_left;
            sevensegment_2[3] <= button_right;
            sevensegment_2[4] <= button_center;
            led_r[13] <= joystick_up;
            led_r[14] <= joystick_down;
            led_r[15] <= joystick_left;
            led_r[16] <= joystick_right;
            led_r[5] <= joystick_pressed;
            led_g[5] <= dip_switches[0];

        end 
    end

    export "DPI-C" function tmp;
    function tmp();
    endfunction
endmodule