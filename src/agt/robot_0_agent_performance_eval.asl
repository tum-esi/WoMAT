// robot_0_agent.asl

askingForbidden.
//wotReceivedDebugMsg.  // uncomment to see debug messages
!init.

//!setup.

+!dealWithObject(Color): true <-
    .print("Dealing with object of color: ", Color);
    .abolish(myStatus(_));
    +myStatus(grippingObject);
    !pickUpObject;
    -myStatus(grippingObject);
    +myStatus(holdingObject);
    !process(Color);
    -myStatus(holdingObject);
    +myStatus(idle).

+!init: true <-
    .print("Initializing robot_0_agent");
    +myStatus(idle);
    +otherRobotArmName(coppeliasim_robot_agent_1);
    +pickupAreaStatus(nothing).

+!setup : true <-
    .print("Setting up robot_0_agent, wait for 3s to save time for recording");
    .wait(3000);
    //+wotReceivedDebugMsg;  // uncomment to see debug messages
    wotAskOne("coppeliasim_sensor_agent", "testOntology:PickupAreaStatus", "testOntology:Measures", true, "pickupAreaStatus");
    +myStatus(idle);
    .wait(2000);
    .print("Setup completed");
    !checkIfICanGrip.


+!checkIfICanGrip: myStatus(idle) & otherRobotArmName(OtherRobotArmName) & pickupAreaStatus(Color)[source(self)] <-
    // only check when im idle

    // first check if I know how to process the object
    .relevant_plans({ +!process(Color) }, P);
    +knowHowToProcess;
    if (.empty(P)) {
        -knowHowToProcess;
        .concat("!", process, "(", Color, ")", X);
        !askForPlan(X); 
    } else {
        // check the other robot status
        .abolish(otherRobotStatus(_));
        wotAskOne(OtherRobotArmName, "testOntology:State", "@type", otherRobotStatus);
        .wait(otherRobotStatus(OtherRobotStatus));

        if (not (OtherRobotStatus == grippingObject) & knowHowToProcess) {
            !dealWithObject(Color);

        } else {
            .wait(500);
        };
    };
    !checkIfICanGrip.



// if the above plan was not machted, try again in 1s
+!checkIfICanGrip: true <- .wait(1000); !checkIfICanGrip.


+pickupAreaStatus(PickupAreaStatus)[source(coppeliasim_sensor_agent)] : true <-
    .print("New PickupAreaStatus from : coppeliasim_sensor_agent , ", PickupAreaStatus);
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
    !moveTo(0.2, 0.4, 0.1);
    !gripObject;
    !goHome.

@[wotExchangable]
+!process(blue) <-
    // @WoT
    !moveTo(0.05, -0.05, 0.4);
    !dropObject;    
    !goHome.

@[wotExchangable]
+!process(green) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !dropObject;
    !goHome.

@[wotExchangable]
+!process(oneStep) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(twoSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !dropObject.

@[wotExchangable]
+!process(threeSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !dropObject;
    !goHome.

@[wotExchangable]
+!process(fourSteps) <-
    // @WoT
    !gripObject;
    !moveTo(0.2, -0.35, 0.3);
    !dropObject;
    !goHome.

@[wotExchangable]
+!process(fiveSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !gripObject;
    !moveTo(0.2, -0.35, 0.3);
    !dropObject;
    !goHome.

@[wotExchangable]
+!process(sixSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !gripObject;
    !moveTo(0.2, -0.35, 0.3);
    !dropObject;
    !goHome.


@[wotExchangable]
+!process(oneSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(fiveSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(tenSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(fifteenSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(twentySteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(twentyfiveSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).


@[wotExchangable]
+!process(thirtySteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(fiftySteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).

@[wotExchangable]
+!process(hundredSteps) <-
    // @WoT
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3);
    !moveTo(0.2, -0.35, 0.3).

-!process(nothing): true <- 
    .print("No object to process"); 
    .wait(500).



-!process(Color): true <-
    // plan triggers, when I dont have a suiting plan
    .print("no plan to process object of color: ", Color).


// plans that are also in TD
+!moveTo(X, Y, Z): true <-
    .abolish(movedTo(_, _, _));
    wotAchieve("ownLayer1", "moveTo", [X, Y, Z]);
    .wait(movedTo(X, Y, Z)).

+!goHome: true <-
    .abolish(movedTo(_));
    wotAchieve("ownLayer1", "goHome", []);
    .wait(movedTo(home)).

+!gripObject: true <-
    .abolish(grippedObject);
    wotAchieve("ownLayer1", "gripObject", []);
    .wait(grippedObject);
    +holdingSth.

+!dropObject: true <-
    .abolish(droppedObject);
    wotAchieve("ownLayer1", "dropObject", []);
    .wait(droppedObject);
    -holdingSth.

// to answer property read
+?state(MessageID): myStatus(Status) <-
    //.print("My status is: ", Status);
    wotSendTestResponse(Status, MessageID).

{ include("wotPlans.asl") }
// This import is cruitial to work with artifacts. 
{ include("$jacamo/templates/common-cartago.asl") }