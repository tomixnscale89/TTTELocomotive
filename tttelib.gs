include "tttelocomotive.gs"
include "tttesettings.gs"
include "ttte_online.gs" //<kuid:414976:102858> TTTELocomotive Online Library
// include "FigureManager.gs" // <kuid:414976:101989> TTTE Figure Script Library

class tttelib isclass Library
{
  OnlineAccess OA;
  TTTESettings TTTESettingsLibrary;
  TTTEOnline onlineLibrary;
  //  FigureManager m_figureManager;

  Asset easterEgg_Asset;

  public void Init(Asset asset)
  {
    inherited(asset);
    TTTESettingsLibrary = cast<TTTESettings>World.GetLibrary(asset.LookupKUIDTable("settings")); //library kuid-table, not loco
    onlineLibrary = cast<TTTEOnline>World.GetLibrary(asset.LookupKUIDTable("onlinelibrary"));
    // m_figureManager = cast<FigureManager>(World.GetLibrary(asset.LookupKUIDTable("figure-library")));

    easterEgg_Asset = asset.FindAsset("misc-menu");

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

  public Asset GetEasterEggAsset()
  {
    return easterEgg_Asset;
  }

  public TTTEOnline GetOnlineLibrary()
  {
    return onlineLibrary;
  }

  // public FigureManager GetFigureManager()
  // {
  //   return m_figureManager;
  // }
};
