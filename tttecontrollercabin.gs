
class tttecontrollercabin isclass Cabin
{
	Locomotive loco;
	
	//Forwards all ControlSet messages to the locomotive, since we can't get the cabin object of a loco for some reason
	public void Init(void) {
		inherited();

		loco = cast<Locomotive>me.GetParentObject();
		
		Sniff(loco, "ControlSet", "", true);
	}
};