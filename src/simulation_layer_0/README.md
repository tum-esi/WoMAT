# Two Robot Arm simulation

This simulation needs Coppeliasim installed and running. 

This setup is designed for two robot arms to interact with each other.
The robots can be controlled by higher level Things and especially agents.

This setup exposes three TDs:
- (robot_arm_0)[http://192.168.56.1:8081/coppeliasim_virtualrobot_ur3_robot_0]
- (robot_arm_1)[http://192.168.56.1:8082/coppeliasim_virtualrobot_ur3_robot_1]
- (cube sensor)[http://192.168.56.1:8083/coppeliasim_virtual_object_sensor]

Different colored (green, red, blue) cubes get created in the pickup are. 
Once the first cube is out of the area, a new cube with a random color is created.
The object sensor Thing shows this.

The location to pick up the cube is: {"x": 0.2, "y": 0.4, "z": 0.1}

Three conveyor belts are located on the other side of the robot arms.
They can be used to sort the cubes based on color. 

The dropdown of positions for the conveyor belts are
{"x": 0.23, "y": -0.3, "z": 0.4};
{"x": 0.35, "y": 0, "z": 0.4};
{"x": 0.05, "y": 0, "z": 0.4}