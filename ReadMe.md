# WoMAT
This project is a mashup of a [CArtAgO](https://sourceforge.net/projects/cartago/) artifact for [JaCoMo](https://github.com/jacamo-lang/jacamo) and [node-wot](https://www.thingweb.io/) for WoT TDs. 
It enables heterogeneous agents to communicate with each other using the WoT and therefore is called Web of Multi-Agent Things (WoMAT).

This framework was developed as part of the Master Thesis: "WoMAT: Designing and Implementing a Web Enabled Framework for Distributed Multi-Agent Systems" by Roman Binkert and is described in detail there.

Author: Roman Binkert

# Overview
This framework consists of two parts.

First, the *AgentThing* class in typescript. It allows to expose TDs in which the agents capabilites are described.
It forwards Interaction Affordances on the TD to the agent and can also be used to consum other (Agent) Things.

Seconldy, it provides an CArtAgO artifact (*wotCommunicator*) that provides methods to agent to forwards request to its *AgentThing* class in an AgentSpeak like manner. 
This artifact, together with the `wotPlans.asl` agent plans, also allows the *AgentThing* class to add beliefs, goals and plans to the agent.

Each agent needs it own instance of the *AgentThing* class and the *wotCommunicator* artifact. 

To demostrate the usage, an example is given below.

Necessary files:
- JaCoMo
    - Artifact: /src/env/wotCommunication/wotCommunicator.java
    - Plans to include artifact /src/agt/wotPlans.asl
- WoT
    - AgentThing: /src/typescript/agentThing.ts
        - Agent Connector (part of AgentThing): /src/typescript/agentConnector.ts
    - TDs: /src/td/

# Setup

Since this project consists of two frameworks, the setup also needs two steps.
Firstly, the setup of JaCoMo and secondly, the setup of node-wot.

## WoT part

`npm install`

to build: `tsc`. This throws some errors in node-wot modules but they can be ignored. 

to execute: `node ./dist/YOURAGENTTHING.js`

## Agent & JaCoMo part
[Install JaCoMo](https://github.com/jacamo-lang/jacamo/blob/main/doc/install.adoc)

The Methods provided by the artifact that can be used by agents are described in the [wotCommunicator Doc](/doc/wotCommunicator.md).
The artifact needs to be added to the agents workspace and the `wotPlans.asl` file needs to be included in the agents file. 

run `./gradlew` to execute the agent part.

# Example Simulation
To show a usecase of this framework, we have developed a with two robots arms in [Coppeliasim](https://www.coppeliarobotics.com/).
The devices of layer 0 (2 robot arms and a sensor identifying new objects) are exposed as TDs.

A video of this demonstration can be seen at [Demo Video](/WoMAT_Application_Demo.mp4)
The performance of our framework is evaluated in [Performance Evaluation](/performance_log/ReadMe.md)

## Run the Simulation 
1. Start Coppeliasim
2. Start the layer 0 Things (this also loads the Coppeliasim scene).
```
node .\dist\simulation_layer_0\2_Robot_wot_server.js
```

3. Once the TDs of the robot arms are exposed we can run all the necessarey *AgentThing* instances to expose the agent TDs for the robot arms and the sensor.
The sensor is not connected to a JaCoMo agent, but is implemented as a conventional Thing. This shows that agents can don't need to distinguish between other Agent Things and conventional Things for normal communication (no plan exchange).
Built the js files with `tsc` and run  agent TD in a seprate console:

```every
node .\dist\WoT\robot_simulation\sim_objec_sensor_agent.js
node .\dist\WoT\robot_simulation\robot_agent_0.js
node .\dist\WoT\robot_simulation\robot_agent_1.js
```

Then finally start the agents with `./gradlew`. 
Both agents are started in the same JaCoMo session but in different workspaces and they are therefore not connected in JaCoMo.
These allows for better logging of the agent communication. 


# Matching from TD to Agent

Exposed TD:

```
readProperty("propertyName") -> ?propertyName(MessageID): true <- wotSendTestResponse(Response, MessageID).
ActionOutput = invokeAction("actionName", inputValue) -> !actionName(inputValue, MessageID): true <- wotSendTestResponse(ActionOutput, MessageID).
PlanString = invokeAction("askHow", planLabel) -> automatically returns array of all plans that match planLabel
```

Consuming other Agent TDs:
```
    wotAskHow("test_agent_thing1", "!test"); -> adds all plans that match !test to my plan library
    wotAskOne("test_agent_thing1", "aNumber", "properties", otherAgentsNumber). -> readProperty(aNumber) of test_agent_thing1, adds return value as +otherAgentsNumber(returnValue)

    -!dropObject(Color): true <- .concat("!dropObject(", Color, ")", X); wotAskHow(otherAgent, X) -> ask other agent for plans with !dropObject(red) or whatever Color was.
```

The **source** is always added and can be accessed with `[source(Source)]`. In the exposed functions, source is set to "unknown" because this is not logged from Exposed TD.

