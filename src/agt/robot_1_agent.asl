// robot_1_agent.asl

//askingForbidden.
// wotReceivedDebugMsg. // uncomment to see debug messages
!init.

!setup.

+!dealWithObject(Color): true <-
    .print("Dealing with object of color: ", Color);
    .abolish(myStatus(_));
    +myStatus(grippingObject);
    !pickUpObject;
    -myStatus(grippingObject);
    +myStatus(holdingObject);
    !dealWith(Color);
    -myStatus(holdingObject);
    +myStatus(idle).

+!init: true <-
    .print("Initializing robot_1_agent");
    +myStatus(idle);
    +otherRobotArmName(coppeliasim_robot_agent_0);
    +pickupAreaStatus(nothing).

+pickupAreaStatus(Color)[source(coppeliasim_sensor_agent)] : true <-
    .print("New PickupAreaStatus: ", Color);
    .abolish(pickupAreaStatus(_));
    +pickupAreaStatus(Color).

+!setup : true <-
    .print("Setting up robot_1_agent, wait for 3s to save time for recording");
    .wait(3000);
    //+wotReceivedDebugMsg;  // uncomment to see debug messages
    wotAskOne("coppeliasim_sensor_agent", "testOntology:PickupAreaStatus", "testOntology:Measures", true, "pickupAreaStatus");
    +myStatus(idle);
    .wait(2000);
    .print("Setup completed; waiting for objects to process.");
    !checkIfICanGrip.


+!checkIfICanGrip: myStatus(idle) & otherRobotArmName(OtherRobotArmName) & pickupAreaStatus(Color)[source(self)] <-
    // only check when im idle

    // first check if I know how to process the object
    .relevant_plans({ +!dealWith(Color) }, P);
    +knowHowToProcess;
    if (.empty(P)) {
        -knowHowToProcess;
        .print("Dont know how to process object of color: ", Color);
        .concat("!", dealWith, "(", Color, ")", X);
        !askForPlan(X); 
    };

    // check the other robot status
    .abolish(otherRobotStatus(_));
    wotAskOne(OtherRobotArmName, "testOntology:State", "@type", otherRobotStatus);
    .wait(otherRobotStatus(OtherRobotStatus));

    if (not (OtherRobotStatus == grippingObject) & knowHowToProcess) {
        !dealWithObject(Color);

    } else {
        .wait(500);
    };
    !checkIfICanGrip.



// if the above plan was not machted, try again in 1s
+!checkIfICanGrip: true <- .wait(1000); !checkIfICanGrip.


+pickupAreaStatus(PickupAreaStatus)[source(coppeliasim_sensor_agent)] : true <-
    //.print("New PickupAreaStatus from : coppeliasim_sensor_agent , ", PickupAreaStatus);
    .abolish(pickupAreaStatus(_));
    +pickupAreaStatus(PickupAreaStatus).

// only ask for a plan if I havent asked for it yet
+!askForPlan(PlanTrigger): otherRobotArmName(OtherRobotArmName) <-
    if(alreadyAskedFor(PlanTrigger, OtherRobotArmName) | askingForbidden) {
        //.print("Already asked, but got no answer for plan: ", PlanTrigger);
    } else {
        .print("Asking for plan: ", PlanTrigger);
        wotAskHow(OtherRobotArmName, PlanTrigger);
        +alreadyAskedFor(PlanTrigger, OtherRobotArmName);
    }.

@[wotExchangable]
+!pickUpObject <-
    // @WoT
    !moveAt(0.2, 0.4, 0.1);
    !take;
    !homeing.

@[wotExchangable]
+!dealWith(red) <-
    // @WoT
    !moveAt(0.3, -0.05, 0.4);
    !release;
    !homeing.

+!dealWith(nothing): true <- 
    .print("No object to process"); 
    .wait(500).

-!dealWith(Color): true <-
    // plan triggers, when I dont have a suiting plan
    .print("no plan to process object of color: ", Color).


// plans that are also in TD
+!moveAt(X, Y, Z): true <-
    .abolish(movedTo(_, _, _));
    wotAchieve("ownLayer1", "moveAt", [X, Y, Z]);
    .wait(movedTo(X, Y, Z)).

+!homeing: true <-
    .abolish(movedTo(_));
    wotAchieve("ownLayer1", "homeing", []);
    .wait(movedTo(home)).

+!take: true <-
    .abolish(grippedObject);
    wotAchieve("ownLayer1", "take", []);
    .wait(grippedObject);
    +holdingSth.

+!release: true <-
    .abolish(droppedObject);
    wotAchieve("ownLayer1", "release", []);
    .wait(droppedObject);
    -holdingSth.

// to answer property read
+?status(MessageID): myStatus(Status) <-
    //.print("My status is: ", Status);
    wotSendTestResponse(Status, MessageID).

{ include("wotPlans.asl") }
// This import is cruitial to work with artifacts. 
{ include("$jacamo/templates/common-cartago.asl") }