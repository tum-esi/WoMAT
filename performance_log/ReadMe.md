# Performance Evaluation

The influence of the translation on the whole communication regarding the execution time is evaluated in the following.
The time it takes for the exposed Agent to answer an `askHow` request is measured. 

## Performance Measure
To log the performance time, the `agentThing.ts` has been adapted to `agentThing_performance_eval.ts`.
The action Handler for the `askHow` action (line 166) has been changed to measure the execution times.
All overhead (logging) has been disabled.
The following times are measured:

 - **Total exeution time**: The time it takes when the handler gets called until it has a plan result. This includes: 
    1. translating the plan Label from ontology to exposedAgent
    2. sending a message to the Cartago artifact which crawls the plan library and sends back the suiting plans
    3. translating the plan steps from exposedAgent to ontology and then to target Agent

Also the time it takes for step 1 and step 3 are measured, as these are the overhead for translating the plan between different concrete namings.

These times are measured for different scenarios.
In all scenarios, one agent asks another agent for a plan.
This plan consists of (1, 5, 10, 15, 20, 25, 30, 50, 100) steps. 
Robot 0 has the plans (`robot_0_agent_performance_eval.asl`) and robot 1 (`robot_1_agent_performance_eval.asl`) sends the request for the plans.
This is done for 30 times. 

The data is stored in `translation_times.txt`.

## Evaluation
The data shows that the time for the label translation (`label_translation_time`) is consistent for all plans, which can easily be explained since also the label is the same each time, regardless of the steps per plan.

The plan translation (`plan_translation_time`) takes longer for longer plans which also makes sense since the translation has to be done for each step.

In comparison to the total execution time (`total_execution_time`) the plan translation takes about one magnitude shorter (`process_time_eval.svg`) as shown in [time evaluation](/performance_log/process_time_eval.svg).
Therefore, we see the time for the overhead as neglectable. 
 