The **wotCommunicator** is a cartago artifact for JaCoMo agents to communicate via the Web of Things.

Each agent needs to have its own artifact and therefore each agent needs to have its own workspace.
It is designed in a way, that a JaCoMo istance is just the wrapper for one agent. Each agent shall have its own JaCoMo instance running. The communication between the agents happens through the Web of Things and therefore as far as your Web of Things network reaches.

The Web of Things part happens through the `AgentThing` class in `agentThing.ts`. An instance of an artifact is connected with its AgentThing through a local websocket.

The agentThing is the server of this local websocket and therefore needs to be started first.
The wotCommunicator then connects to its agentThing websocket which then translates the agents request into WoT speech and forwards the agents requests to other Things (can be agents).

# Methods
The following methods can be used in the agent to communicate with other Things (e.g. Agents).

`wotAskOne(targetAgentName, keyword, path, observe)`:
    targetAgentName: the name of the agent to ask
    keyword: the keyword to ask for. Should be an ontology name 

ToDo: describe others
    