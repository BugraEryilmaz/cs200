module tb (
        input        clk_i,
        input        rst_ni,
        output reg [7:0] sevensegment_2_o,
        output reg [119:0] led_r_o,
        output reg [119:0] led_g_o,
        input button_top_i,
        input button_bottom_i,
        input button_left_i,
        input button_right_i,
        input button_center_i,
        input [7:0] dip_switches_i,
        input joystick_up_i,
        input joystick_down_i,
        input joystick_left_i,
        input joystick_right_i,
        input joystick_pressed_i
    );
    

    always @(posedge clk_i) begin
        if (rst_ni == 0) begin
            sevensegment_2_o <= 0;
            led_r_o <= 0;
            led_g_o <= 0;
        end
        else begin
            led_g_o[7:0] <= dip_switches_i;
            sevensegment_2_o[0] <= button_top_i;
            sevensegment_2_o[1] <= button_bottom_i;
            sevensegment_2_o[2] <= button_left_i;
            sevensegment_2_o[3] <= button_right_i;
            sevensegment_2_o[4] <= button_center_i;
            led_r_o[13] <= joystick_up_i;
            led_r_o[14] <= joystick_down_i;
            led_r_o[15] <= joystick_left_i;
            led_r_o[16] <= joystick_right_i;
            led_r_o[5] <= joystick_pressed_i;
            led_g_o[5] <= dip_switches_i[0];

        end 
    end
endmodule