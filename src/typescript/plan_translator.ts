/* Can translate an agent plan into another nameSpace Using two TDs and an ontology. 

# To create a plan that can be exported
planString2OntologyPlanObject: translates from first TD to plan structure
OntologyPlanObject2TargetPlanObject: reverses plansString2Ontology translation but should be used with a different TD

# To use a plan that was imported
TargetPlanObject2CommandString: translates OntologyPlan

PlanObject(type: Plan): {
    planLabel: string;
    planInput: string[];
    planSteps: PlanStep[];
}
*/

type PropertyDescription = {
    type: string;
    "@type"?: string;
    description: string;
};

type InputDescription = {
    type: string;
    properties: {
        [key: string]: PropertyDescription;
    };
    description: string;
};

type ActionDescription = {
    description: string;
    "@type"?: string;
    input?: InputDescription;
    forms: Array<{ href: string; contentType: string; "htv:methodName": string }>;
};

type ThingDescription = {
    title: string;
    description: string;
    "@context": Array<string | object>;
    securityDefinitions: object;
    security: string;
    properties: { [key: string]: any };
    actions: { [key: string]: ActionDescription };
};

export type AdditionalOntology = {
    [key: string]: string;
};

// Example of an additional ontology, hardcoded for simplicity
const additionalOntology: AdditionalOntology = {
    "blue": "ObjectBlue",
    "process": "Process"
};

function translateTerm(term: string, ontology: AdditionalOntology): string {
    return ontology[term] || term;
}

export function planString2OntologyPlanObject(planString: string, td: ThingDescription, ontology: AdditionalOntology): any {
    const translateCommand = (command: string, params: string[]): any => {
        const actionData = td.actions[command];
        if (!actionData) {
            console.error(`No action data found for command: ${command}`);
            return null; // Guard against missing action definitions
        }
    
        const translatedCommand = actionData["@type"] ? actionData["@type"].split(':').pop() : command;
        const inputs = {};
        if (actionData.input && actionData.input.properties && params.length > 0) {
            params.forEach((param, index) => {
                const key = Object.keys(actionData.input.properties)[index];
                const propName = actionData.input.properties[key]["@type"] ? actionData.input.properties[key]["@type"].split(':').pop() : key;
                inputs[propName] = param.trim();
            });
            return { [translatedCommand]: { input: inputs } };
        } else {
            // Ensure even actions without parameters are included
            return { [translatedCommand]: {} };
        }
    };
    
    // Update the regex if necessary, but it seems fine based on your split result.
    

    // Ensure regex captures the entire action sequence correctly
    const regex = /{ \+!(\w+)(?:\(([^)]*)\))? <- (.+) }/;
    const match = planString.match(regex);
    if (match) {
        const planLabel = translateTerm(match[1], ontology);
        const planInput = [translateTerm(match[2], ontology)];
        const actions = match[3].split(';').map(action => action.trim());

        const planSteps = actions.map(action => {
            // const actionMatch = action.match(/!(\w+)\((.*?)\)/);
            const actionMatch = action.match(/!(\w+)(?:\((.*?)\))?/);

            if (actionMatch) {
                const command = actionMatch[1];
                const params = actionMatch[2] ? actionMatch[2].split(',').map(param => param.trim()) : [];
                return translateCommand(command, params);
            }
            return null;
        }).filter(step => step != null);

        return {
            planLabel: planLabel,
            planInput: planInput,
            planSteps: planSteps
        };
    }
    return null;
}

export function OntologyPlanObject2TargetPlanObject(inputPlan: any, td: ThingDescription): any {
    const outputPlan = { ...inputPlan, planSteps: [] as any[] };

    inputPlan.planSteps.forEach(step => {
        const actionKey = Object.keys(step)[0]; // Original action name
        // Find the action in TD based on @type ending matching the original action name
        const actionData = Object.values(td.actions).find(a => a["@type"]?.endsWith(actionKey));
        const newActionKey = actionData ? Object.keys(td.actions).find(key => td.actions[key] === actionData) : actionKey;

        const newStep = { [newActionKey]: {} };
        if (step[actionKey].input) {
            newStep[newActionKey].input = {};
            Object.entries(step[actionKey].input).forEach(([paramKey, paramValue]) => {
                const foundProperty = Object.entries(actionData.input.properties).find(([propKey, propVal]) => propVal["@type"]?.endsWith(paramKey));
                const newParamKey = foundProperty ? foundProperty[0] : paramKey;
                newStep[newActionKey].input[newParamKey] = paramValue;
            });
        }
        outputPlan.planSteps.push(newStep);
    });

    return outputPlan;
}


//####################################################
// to be used when an answer is received
//####################################################

type PlanStep = {
    [action: string]: {
        input?: {
            [param: string]: string;
        }
    };
};

type Plan = {
    planLabel: string;
    planInput: string[];
    planSteps: PlanStep[];
};


export function planLabel2OntologyLabel(command: string, ontology: AdditionalOntology): string {
    // Regular expression to extract the command and parameters with variable prefixes ! or ?
    const regex = /([!?])(\w+)\(([\w, ]+)\)/;
    const matches = command.match(regex);
    if (matches && matches.length === 4) {
        const prefix = matches[1];          // e.g., "!" or "?"
        const commandPart = matches[2];     // e.g., "process"
        const paramPart = matches[3];       // e.g., "blue"

        // Translate the command and parameter parts
        const translatedCommand = translateTerm(commandPart, ontology); // Translate "process"
        const params = paramPart.split(',').map(param => 
            translateTerm(param.trim(), ontology) // Translate each parameter individually
        );

        // Reassemble into the desired format with the original prefix
        return `${prefix}${translatedCommand}(${params.join(', ')})`;
    }
    return command; // Return the original command if it doesn't match expected pattern
}

export function ontologyLabel2planLabel(command: string, ontology: AdditionalOntology): string {
    // Create a reverse mapping from the provided ontology
    const reverseOntology = Object.fromEntries(Object.entries(ontology).map(([key, value]) => [value, key]));

    // Regular expression to extract the command and parameters with variable prefixes ! or ?
    const regex = /([!?])(\w+)\(([\w, ]+)\)/;
    const matches = command.match(regex);
    if (matches && matches.length === 4) {
        const prefix = matches[1];          // e.g., "!" or "?"
        const commandPart = matches[2];     // e.g., "Process"
        const paramPart = matches[3];       // e.g., "ObjectBlue"

        // Translate the command and parameter parts using the reverse ontology
        const originalCommand = reverseOntology[commandPart] || commandPart; // Reverse translate "Process"
        const params = paramPart.split(',').map(param => 
            reverseOntology[param.trim()] || param.trim() // Reverse translate each parameter individually
        );

        // Reassemble into the original format with the original prefix
        return `${prefix}${originalCommand}(${params.join(', ')})`;
    }
    return command; // Return the original command if it doesn't match expected pattern
}


export function TargetPlanObject2CommandString(plan: Plan, ontology: AdditionalOntology): string {
    const reverseOntology = Object.fromEntries(Object.entries(ontology).map(([key, value]) => [value, key]));

    // Translate the plan label using the ontology
    const planLabel = reverseOntology[plan.planLabel] || plan.planLabel;

    // Translate plan inputs using the ontology
    const planInputs = plan.planInput.map(input => reverseOntology[input] || input);

    // Construct the command string from plan steps
    const steps = plan.planSteps.map(step => {
        const action = Object.keys(step)[0];
        const details = step[action];
        if (details.input && Object.keys(details.input).length > 0) {
            // Sort keys to maintain consistent order (X_Value, Y_Value, Z_Value)
            const params = Object.entries(details.input)
                .sort(([key1], [key2]) => key1.localeCompare(key2))
                .map(([param, value]) => `${value}`).join(',');
            return `!${action}(${params})`;
        }
        return `!${action}`;
    });

    // Assemble the final command string
    const commandString = `{ +!${planLabel}(${planInputs.join(', ')}) <- ${steps.join('; ')} }`;
    return commandString;
}