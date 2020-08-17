include "MeshObject.gs"
include "MapObject.gs"
include "IKManager.gs"
include "IKMath.gs"
include "WorldCoordinate.gs"
include "Orientation.gs"
include "Vehicle.gs"

class Coordinate
{
  public float x = 0.0;
  public float y = 0.0;
  public float z = 0.0;
  public void Add(Coordinate othercoord)
  {
    x = x + othercoord.x;
    y = y + othercoord.y;
    z = z + othercoord.z;
  }
  public void Subtract(Coordinate othercoord)
  {
    x = x - othercoord.x;
    y = y - othercoord.y;
    z = z - othercoord.z;
  }
  public void Rotate(float r_x, float r_y, float r_z) //more or less verified
  {
    //float newx;
    //float newy;
    //float newz;

    x = x*IKMath.fast_cos(r_z) - y*IKMath.fast_sin(r_z);
    y = x*IKMath.fast_sin(r_z) + y*IKMath.fast_cos(r_z);

    x = x*IKMath.fast_cos(r_y) - z*IKMath.fast_sin(r_y);
    z = x*IKMath.fast_sin(r_y) + z*IKMath.fast_cos(r_y);

    y = y*IKMath.fast_cos(r_x) - z*IKMath.fast_sin(r_x);
    z = y*IKMath.fast_sin(r_x) + z*IKMath.fast_cos(r_x);
  }
  public string AsString()
  {
    return "X: " + (string)x + " Y: " + (string)y + " Z: " + (string)z;
  }
};

class IKCoupler isclass MeshObject
{
  Browser browser;
  IKManager IKSystem;
  Soup Lengths;
  public Vehicle ParentVehicle;
  public string Position;
  Coordinate CoupleTarget = new Coordinate();

  //definitions
  void ConstructBrowser();
  string GetWindowHTML();
  thread void IKThread();
  thread void CoupleThread();
  public void Init()
  {
    inherited();

    Soup ExtensionsContainer = GetAsset().GetConfigSoup().GetNamedSoup("extensions");
    Lengths = ExtensionsContainer.GetNamedSoup("IKLengths");

    IKSystem = new IKManager();
    IKSystem.BuildIKSystem(3, me);
    IKSystem.SetLinkRotation(0, 1.5708, 0.0, 0.0);//1.5708
    //ConstructBrowser();
    //IKThread();
    CoupleTarget.y = -0.1;
    CoupleThread();
  }

  float lerp(float start, float end, float along)
  {
    return (end - start) * along + start;
  }

  void SetMidLength(float inframe)
  {
    float defaultlength = Str.ToFloat(Lengths.GetNamedTag("link1"));
    float offset = lerp(0.0, 0.2, inframe / 100.0);
    IKSystem.SetLinkLength(1, defaultlength + offset);
  }

  public void SetCoupleTarget(float TargetX, float TargetY, float TargetZ, float Midframe)
  {
    SetMeshAnimationFrame("link1", Midframe);
    SetMidLength(Midframe);
    SetMeshTranslation("target", TargetX, TargetY, TargetZ);
    IKSystem.UpdateIKTransforms(TargetX, TargetY, TargetZ);
  }


  Coordinate WorldCoordinateToCoordinate(WorldCoordinate convert)
  {
    Coordinate converted = new Coordinate();
    converted.x = convert.x + convert.baseboardX * 720;
    converted.y = convert.y + convert.baseboardY * 720;
    converted.z = convert.z;
    return converted;
  }

  Coordinate GetAttachmentRelativeLocation(IKCoupler TargetAttachment) //verified working
  {
    Asset vehicleasset = TargetAttachment.ParentVehicle.GetAsset();
    //AsyncQueryHelper configcache = vehicleasset.CacheConfigSoup();
    //configcache.SynchronouslyWaitForResults();
    Soup dataContainer = vehicleasset.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("coupler-locations");
    Coordinate RelativeLocation = new Coordinate();
    string[] Coords = Str.Tokens(dataContainer.GetNamedTag(TargetAttachment.Position), ",");
    RelativeLocation.x = Str.ToFloat(Coords[0]);
    RelativeLocation.y = Str.ToFloat(Coords[1]);
    RelativeLocation.z = Str.ToFloat(Coords[2]);
    return RelativeLocation;
  }

  Coordinate GetAttachmentAbsoluteLocation(IKCoupler TargetAttachment)
  {
    Coordinate ParentLocation = WorldCoordinateToCoordinate(TargetAttachment.ParentVehicle.GetMapObjectPosition());
    Orientation ParentRotation = TargetAttachment.ParentVehicle.GetMapObjectOrientation();

    Coordinate RelativeLocation = GetAttachmentRelativeLocation(TargetAttachment);
    //TrainzScript.Log("relative start " + RelativeLocation.AsString() + " around " + (string)ParentRotation.rx + " " + (string)ParentRotation.ry + " " + (string)ParentRotation.rz);
    RelativeLocation.Rotate(ParentRotation.rx, ParentRotation.ry, ParentRotation.rz);
    //TrainzScript.Log("relative rotated " + RelativeLocation.AsString());
    ParentLocation.Add(RelativeLocation);
    return ParentLocation;
  }

  Coordinate GetRelativeCoordinates(IKCoupler OtherAttachment)
  {
    Coordinate MyLocation = GetAttachmentAbsoluteLocation(me);
    Coordinate OtherLocation = GetAttachmentAbsoluteLocation(OtherAttachment);

    Coordinate RelativeLocation = OtherLocation;
    RelativeLocation.Subtract(MyLocation);

    //rotate back into our local coordinate space
    Orientation MyRotation = ParentVehicle.GetMapObjectOrientation();
    RelativeLocation.Rotate(-MyRotation.rx, -MyRotation.ry, -MyRotation.rz);

    return RelativeLocation;
  }

  public void CoupleTo(IKCoupler OtherAttachment)
  {
    TrainzScript.Log("COUPLING TO");
    if(OtherAttachment)
    {
      Coordinate RelativeLocation = GetRelativeCoordinates(OtherAttachment);
      TrainzScript.Log("relative location " + RelativeLocation.AsString());
    }
    else
    {
      CoupleTarget.y = -1.0;
    }
  }

  public void DecoupleFrom(IKCoupler OtherAttachment)
  {
    TrainzScript.Log("COUPLING FROM");
    if(OtherAttachment)
    {

    }
    else
    {
      CoupleTarget.y = -0.1;
    }
  }

  // ============================================================================
  // Name: CoupleThread()
  // Desc: Manages couple interaction.
  // ============================================================================
  thread void CoupleThread()
  {
    while(true)
    {
      SetCoupleTarget(CoupleTarget.x, CoupleTarget.y, CoupleTarget.z, 0.0);
      Sleep(0.02);
    }
  }

  thread void IKThread()
  {
    while(true)
    {
      string Xstr = browser.GetElementProperty("Xtarg", "value");
      string Ystr = browser.GetElementProperty("Ytarg", "value");
      string Zstr = browser.GetElementProperty("Ztarg", "value");
      string Midstr = browser.GetElementProperty("Midframe", "value");

      float TargetX = Str.ToFloat(Xstr) / 40.0;
      float TargetY = Str.ToFloat(Ystr) / 40.0;
      float TargetZ = Str.ToFloat(Zstr) / 40.0;

      float Midframe = Str.ToFloat(Midstr);
      SetMeshAnimationFrame("link1", Midframe);
      SetMidLength(Midframe);
      SetMeshTranslation("target", TargetX, TargetY, TargetZ);
      //SetMeshOrientation("link1", TargetX, 0.0, 0.0);

      IKSystem.UpdateIKTransforms(TargetX, TargetY, TargetZ);
      Sleep(0.02);
    }
  }

  void ConstructBrowser()
  {
    browser = null;
    if ( !browser )	browser = Constructors.NewBrowser();

    browser.SetCloseEnabled(true);
  	browser.SetWindowPosition(Interface.GetDisplayWidth() - 320, Interface.GetDisplayHeight() - 525);
  	browser.SetWindowSize(300, 350);
  	browser.SetWindowVisible(true);
  	browser.LoadHTMLString(GetAsset(), GetWindowHTML());
  }

  string GetWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<table>");

    //Options
    output.Print("<tr><td>");
    output.Print("<font><b>IK Controls</font>");
    output.Print("</tr></td>");

    //controls
    output.Print("<tr><td>");
    output.Print("X:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='Xtarg' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print("Y:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='Ytarg' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print("Z:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='Ztarg' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print("Middle:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='Midframe' min=0.0 max=100.0 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }
};