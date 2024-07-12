// agentConnector.ts

/*  This file is the agent connector. It is responsible for the communication between the agent TD and the agents JaCoMo artifact. 
*/
import * as WebSocket from 'ws';

type AgentInteractionAffordances = "tell" | "untell" | "askOne" | "askAll";

export class AgentMessage {
    performative: string;
    sourceAgentId: string;
    targetAgentId: string;
    content: Object;
    messageId: number = -1;
    isResponse: boolean = false;

    constructor(performative: string, sourceAgentId: string,  targetAgentId:string, content: object, messageId: number = -1, isResponse: boolean = false) {
        this.performative = performative;
        this.sourceAgentId = sourceAgentId;
        this.targetAgentId = targetAgentId;
        this.content = content;
        this.messageId = messageId;
        this.isResponse = isResponse;
    }

    static fromString(message: string): AgentMessage {
        const data = JSON.parse(message);
        return new AgentMessage(data.performative, data.sourceAgentId, data.targetAgentId, data.content, data.messageId, data.isResponse);
    }

    toString(): string {
        return JSON.stringify({
            performative: this.performative,
            sourceAgentId: this.sourceAgentId,
            targetAgentId: this.targetAgentId,
            content: this.content,
            messageId: this.messageId,
            isResponse: this.isResponse
        });
    }
}

export class AgentConnector {
    private wss!: WebSocket.Server;
    private wsPort: number;
    public loggingLevel: number = 0; // 0: log erros, 1: log erros and IA on me / when I invoke IA on others, 2: log IAs with longer input/output, 3: log everything (also messages to wotCommunicator)

    // responseHandlers is a map of requestIds and their corresponding response handlers
    private responseHandlers: Map<number, (value: any) => void> = new Map();
    private requestIdCounter = 0;

    // the agent according agent artifact should be the only client. Therefore I can send to all agents.
    private clients: WebSocket[] = [];

    constructor(wsPort: number) {
        this.wsPort = wsPort;
    }

    public connect(onMessageReceivedCallback: (data: AgentMessage) => void) {
        this.wss = new WebSocket.Server({ port: this.wsPort });

        this.wss.on('connection', (ws: any) => { 
            console.log('New Local Agent connection');
            this.clients.push(ws);
            ws.send('Local Agent Connection established');

            ws.onmessage = (event: any) => {
                const agentMessage = AgentMessage.fromString(event.data.toString());
                if (this.loggingLevel > 2) {console.log('Received message from agent:', JSON.stringify(agentMessage));}
                if (agentMessage.isResponse) {
                    const responseHandler = this.responseHandlers.get(agentMessage.messageId);
                    if (responseHandler) {
                        responseHandler(agentMessage);
                        this.responseHandlers.delete(agentMessage.messageId);
                    } else {
                        console.log('No response handler for message:', agentMessage);
                    }
                } else {
                    onMessageReceivedCallback(agentMessage);
                }
            };

            ws.on('close', () => {
                console.log('Local Agent Connection closed');
                this.clients = this.clients.filter(client => client !== ws);
            });
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }

    public send2Agent(message: AgentMessage) {
        this.forward2Agent(message);
    }

    public forward2Agent(message: AgentMessage) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if (this.loggingLevel > 2) {console.log('Sending message to agent:', JSON.stringify(message));}
                client.send(JSON.stringify(message));
            } else {
                console.error('WebSocket is not open.');
            }
        });
    }

    public async send2AgentAndWaitForResponse(message: AgentMessage): Promise<AgentMessage> {
        return new Promise((resolve, reject) => {
            this.responseHandlers.set(this.requestIdCounter, resolve);
            message.messageId = this.requestIdCounter;
            this.forward2Agent(message);
            this.requestIdCounter++;
        });
    }
}