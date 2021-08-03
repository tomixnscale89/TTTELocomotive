include "tttelocomotive.gs"
include "tttesettings.gs"
include "ttte_online.gs" //<kuid:414976:102858> TTTELocomotive Online Library

class tttelib isclass Library
{
  OnlineAccess OA;
  TTTESettings TTTESettingsLibrary;
  TTTEOnline onlineLibrary;

  public void Init(Asset asset)
  {
    inherited(asset);
    TTTESettingsLibrary = cast<TTTESettings>World.GetLibrary(GetAsset().LookupKUIDTable("settings")); //library kuid-table, not loco

    onlineLibrary = cast<TTTEOnline>World.GetLibrary(GetAsset().LookupKUIDTable("onlinelibrary"));
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

  public TTTEOnline GetOnlineLibrary()
  {
    return onlineLibrary;
  }
};
