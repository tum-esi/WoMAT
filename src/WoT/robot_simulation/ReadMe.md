@author: Roman Binkert (roman.binkert@tum.de)

# Use case simulation
To simulate a use case with two robot arms, a simulation in Coppeliasim can be used.

This simulation is heavily based on (RobWot)[https://gitlab.lrz.de/tum-ei-esi/wot-team/robwot]. 

There change to Robot_WoT_server and run `ts-node .\2_Robot_wot_server.ts`.

## Simulation setup
The simulation includes two robot arms that can move a dice like object from a pickup zone and drop it at a drop of zone. 
A new object appears at the pickup zone once the previous object was moved from there. 

The scene can be accessed through wot by three TDs.

1. Robot1 (192.168.56.1:8081)
2. Robot2 (192.168.56.1:8082)
3. ObjectSensor at pickup zone  (192.168.56.1:8083)

The object can be moved to position `{"x": 0.2, "y": 0.4, "z": 0.1}` to pick up the object.
