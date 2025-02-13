-wotReceivedDebugMsg. 

pickupPosition(array(
    -18.999550262944044,
    -120.90030996467286,
    -63.835956651226816,
    -87.63053633834535,
    90.24231796860695,
    122.57207235813141
)).

middlePosition(array(
    9.490586778968572,
    -78.03853062774354,
    -61.538922554508986,
    -132.41968258525543,
    91.36375604867935,
    151.0086769890785
)).

dropPosition(array(
    36.41864445328712,
    -114.05933620597536,
    -71.38124310638123,
    -85.73209919120485,
    92.24433131575584,
    156.449384663105
)).

pastPresence(0).
!poll_presence.

+!moveMiddle <-
    ?middlePosition(MiddleData);
    .print("move Middle");
    !moveSync(MiddleData);
    .print("reached middle").

+!movePickup <-
    .print("move pickup");
    ?pickupPosition(PickupData);
    !moveSync(PickupData);
    .print("Reached pickup").


+!move: not(busy) & pastPresence(1)<-
    +busy;
    ?middlePosition(MiddleData);
    .print("move Middle");
    !moveSync(MiddleData);
    !openGripper;
    ?pickupPosition(PickupData);
    !moveSync(PickupData);
    !closeGripper;
    !moveSync(MiddleData);
    ?dropPosition(DropData);
    !moveSync(DropData);
    !openGripper;
    !moveSync(MiddleData);
    .print("Execute pick and drop");
    -busy.

-busy <-
    !move.

+pastPresence(1) <-
    !move.

+!moveSync(TargetJoints) <-
    // once the robot has executed the action, it will add the "setJointDegrees" belief. Therefore we can wait for it.
    -setJointDegrees[_];
    -setJointDegrees[source(ur10Thing)];
    .print("Move to: ", TargetJoints);
    -movedTo(_);
    wotAchieve("ur10Thing", "setJointDegrees", TargetJoints);
    .wait(setJointDegrees[source(ur10Thing)]);
    .print("reached: ", TargetJoints).

+!openGripper <-
    wotAchieve("ur10Thing", "openGripper");
    .wait(1000).

+!closeGripper <-
    wotAchieve("ur10Thing", "closeGripper");
    .wait(1000).

// object detection

+!poll_presence: true <-
    -objectPresence(_)[source(infraredThing)]; // delete all objectPresence() beliefs
    wotAskOne("infraredThing", "objectPresence", "properties");
    .wait(500);
    !poll_presence.

+objectPresence(object(CurrentValue))[source(infraredThing)]: pastPresence(PastValue) & not(CurrentValue == PastValue) <-
    // check if the values has changed, if so add a new pastPresence belief.
    .print("Value is: ", CurrentValue, " past is ", PastValue);
    -pastPresence(PastValue);
    +pastPresence(CurrentValue).

// This import is cruitial to work with the WoT Artifact. 
{ include("wotPlans.asl") }
{ include("$jacamo/templates/common-cartago.asl") }