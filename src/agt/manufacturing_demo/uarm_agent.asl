//wotReceivedDebugMsg.  // uncomment to see debug messages


homePosition(object(x(130),y(0),z(80))).
pickUpPositionLow(object(x(155),y(205),z(56))).
pickUpPositionHigh(object(x(155),y(205),z(80))).
dropPositionHigh(object(x(155),y(-205),z(80))).
realPosition(notInit).
pastPresence(0).

!init.
!poll_position.
!poll_presence.

+!init: true <-
    .print("Uarm agent starting...");
    .wait(1000);
    wotAchieve("uarmThing", "beep", "actions");
    .print("Initialized with beep").

+pastPresence(1) <-
    !pickupAndDrop.

+!pickupAndDrop: not(busy) & pastPresence(1) <-
    +busy;
    .print("prepare to pickup and drop object");
    ?pickUpPositionHigh(TargetPosition);
    !moveSync(TargetPosition);
    ?pickUpPositionLow(TargetPosition2);
    !moveSync(TargetPosition2);
    wotAchieve("uarmThing", "gripClose");
    .wait(1000); // wait until gripper is closed
    ?pickUpPositionHigh(TargetPosition3);
    !moveSync(TargetPosition3);
    ?dropPositionHigh(TargetPosition4);
    !moveSync(TargetPosition4);
    wotAchieve("uarmThing", "gripOpen");
    .wait(1000);
    -busy;
    !pickupAndDrop.

+!moveSync(TargetPosition) <-
    .print("Move to: ", TargetPosition);
    -movedTo(_);
    wotAchieve("uarmThing", "goTo", TargetPosition);
    .wait(realPosition(TargetPosition));
    .print("reached: ", TargetPosition).

+!poll_position: true <-
    -newLocation(_)[source(uarmThing)]; // delete all newLocation() beliefs
    wotAskOne("uarmThing", "location", "properties", true, "newLocation");
    .wait(500);
    !poll_position.

+newLocation(CurrentValue)[source(uarmThing)]: realPosition(PastValue) & not(CurrentValue == PastValue) <-
    // check if the values has changed, if so add a new pastPresence belief.
    .print("new is: ", CurrentValue, " real is ", PastValue);
    -realPosition(PastValue);
    +realPosition(CurrentValue);
    -newLocation(_).

// object detection

+!poll_presence: true <-
    -objectPresence(_)[source(infraredThing)]; // delete all objectPresence() beliefs
    wotAskOne("infraredThing", "objectPresence", "properties");
    .wait(500);
    !poll_presence.

+objectPresence(object(CurrentValue)): pastPresence(PastValue) & not(CurrentValue == PastValue) <-
    // check if the values has changed, if so add a new pastPresence belief.
    .print("Value is: ", CurrentValue, " past is ", PastValue);
    -pastPresence(PastValue);
    +pastPresence(CurrentValue).

// This import is cruitial to work with the WoT Artifact. 
{ include("wotPlans.asl") }
{ include("$jacamo/templates/common-cartago.asl") }