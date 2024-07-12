// robot_1_agent.asl

//askingForbidden.
// wotReceivedDebugMsg. // uncomment to see debug messages

!init.
!evaluateLoop.

+!evaluateLoop: true <-
    .print("Staring evaluate Loop");
    for ( .range(I, 1, 30) ) {
        .concat("evaluatePerformance", I, X);
        .print(X);
        !evaluatePerformance;
    }.

+!init: true <-
    .print("Initializing robot_1_agent");
    +myStatus(idle);
    +otherRobotArmName(coppeliasim_robot_agent_0);
    +pickupAreaStatus(nothing).

+!evaluatePerformance: true <-
    .print("Evaluating performance of robot_1_agent");
    .wait(1000);
    .concat("oneStep", X);
    !askForPlan(oneSteps); 
    !askForPlan(fiveSteps); 
    !askForPlan(tenSteps);
    !askForPlan(fifteenSteps);  
    !askForPlan(twentySteps); 
    !askForPlan(twentyfiveSteps); 
    !askForPlan(thirtySteps); 
    !askForPlan(fiftySteps); 
    !askForPlan(hundredSteps); 
    .print("Performance evaluation completed.").


// only ask for a plan if I havent asked for it yet
+!askForPlan(PlanName): otherRobotArmName(OtherRobotArmName) <-
    .wait(3000);
    .concat("!", process, "(", PlanName, ")", PlanTrigger);
    
    .print("Asking for plan: ", PlanTrigger);
    wotAskHow(OtherRobotArmName, PlanTrigger).

{ include("wotPlans.asl") }
// This import is cruitial to work with artifacts. 
{ include("$jacamo/templates/common-cartago.asl") }