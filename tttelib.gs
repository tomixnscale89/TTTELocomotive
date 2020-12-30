include "tttelocomotive.gs"
include "tttesettings.gs"

class tttelib isclass Library
{
  OnlineAccess OA;
  TTTESettings TTTESettingsLibrary;
  public void Init(Asset asset)
  {
    inherited(asset);
    TTTESettingsLibrary = cast<TTTESettings>World.GetLibrary(GetAsset().LookupKUIDTable("settings")); //library kuid-table, not loco

    //OA = GetOnlineAccess();
  }
  public Soup GetSettings()
  {
    //Soup LocalData = Constructors.NewSoup();
    //OA.GetLocalData("tttelocosettings", LocalData);
    if(TTTESettingsLibrary)
      return TTTESettingsLibrary.GetSettings();
    
    return Constructors.NewSoup();
  }
};
