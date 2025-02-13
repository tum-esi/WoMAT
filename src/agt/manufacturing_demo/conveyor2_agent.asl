//wotReceivedDebugMsg.  // uncomment to see debug messages
pastPresence(0). // init this belief to not need a fallback to create it. 
!init.

+!init: true <-
    .print("Converyor 1 agent starting...");
    .wait(1000);
    wotAchieve("conveyorThing", "startBeltForward", "actions");
    wotAskOne("infraredThing", "objectPresence", "properties");
    .print("Asked Infrared1");
    !poll_presence.

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

+pastPresence(1) <-
    .print("Object new detected");
    wotAchieve("conveyorThing", "stopBelt", "actions").

+pastPresence(0) <-
    .print("Object remove new detected");
    wotAchieve("conveyorThing", "startBeltForward", "actions").

// This import is cruitial to work with the WoT Artifact. 
{ include("wotPlans.asl") }
{ include("$jacamo/templates/common-cartago.asl") }