include "MeshObject.gs"
include "MapObject.gs"
include "IKManager.gs"
include "IKMath.gs"
include "WorldCoordinate.gs"
include "Orientation.gs"
include "Vehicle.gs"

class Coordinate2D
{
  public float x = 0.0;
  public float y = 0.0;
  public Coordinate2D Rotate(float rotateangle)
  {
    Coordinate2D newpoint = new Coordinate2D();
    newpoint.x = x * IKMath.fast_cos(rotateangle) - y * IKMath.fast_sin(rotateangle);
    newpoint.y = x * IKMath.fast_sin(rotateangle) + y * IKMath.fast_cos(rotateangle);
    return newpoint;
  }
};

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

  Coordinate2D RotateAxis(float in_x, float in_y, float angle)
  {
    Coordinate2D AxisRotation = new Coordinate2D();
    AxisRotation.x = in_x;
    AxisRotation.y = in_y;
    return AxisRotation.Rotate(angle);
  }

  public Coordinate Rotate(float r_x, float r_y, float r_z) //more or less verified
  {
    //float newx;
    //float newy;
    //float newz;
    Coordinate OutCoord = new Coordinate();
    //tried xyz, zyx, yxz



    Coordinate2D XRotation = RotateAxis(y, z, r_x);
    OutCoord.y = XRotation.x;
    OutCoord.z = XRotation.y;

    Coordinate2D YRotation = RotateAxis(x, OutCoord.z, r_y);
    OutCoord.x = YRotation.x;
    OutCoord.z = YRotation.y;

    Coordinate2D ZRotation = RotateAxis(OutCoord.x, OutCoord.y, r_z);
    OutCoord.x = ZRotation.x;
    OutCoord.y = ZRotation.y;


    //Coordinate2D ZRotation = RotateAxis(x, y, r_z);
    //OutCoord.x = ZRotation.x;
    //OutCoord.y = ZRotation.y;

    //Coordinate2D YRotation = RotateAxis(OutCoord.x, z, r_y);
    //OutCoord.x = YRotation.x;
    //OutCoord.z = YRotation.y;

    //Coordinate2D XRotation = RotateAxis(OutCoord.y, OutCoord.z, r_x);
    //OutCoord.y = XRotation.x;
    //OutCoord.z = XRotation.y;

    //OutCoord.x = x*IKMath.fast_cos(r_z) - y*IKMath.fast_sin(r_z);
    //OutCoord.y = x*IKMath.fast_sin(r_z) + y*IKMath.fast_cos(r_z);

    //OutCoord.x = x*IKMath.fast_cos(r_y) - z*IKMath.fast_sin(r_y);
    //OutCoord.z = x*IKMath.fast_sin(r_y) + z*IKMath.fast_cos(r_y);

    //OutCoord.y = y*IKMath.fast_cos(r_x) - z*IKMath.fast_sin(r_x);
    //OutCoord.z = y*IKMath.fast_sin(r_x) + z*IKMath.fast_cos(r_x);
    return OutCoord;
  }
  public Coordinate RotateBack(float r_x, float r_y, float r_z) //more or less verified
  {
    Coordinate OutCoord = new Coordinate();

    Coordinate2D ZRotation = RotateAxis(x, y, r_z);
    OutCoord.x = ZRotation.x;
    OutCoord.y = ZRotation.y;

    Coordinate2D YRotation = RotateAxis(OutCoord.x, z, r_y);
    OutCoord.x = YRotation.x;
    OutCoord.z = YRotation.y;

    Coordinate2D XRotation = RotateAxis(OutCoord.y, OutCoord.z, r_x);
    OutCoord.y = XRotation.x;
    OutCoord.z = XRotation.y;

    return OutCoord;
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
  public IKCoupler coupled;
  public Coordinate CachedRelativeLocation;
  Coordinate CoupleTarget = new Coordinate();

  float MidLength = 0.0;
  bool Animating = false;

  //definitions
  void ConstructBrowser();
  string GetWindowHTML();
  thread void IKThread();
  thread void CoupleThread();
  Coordinate GetAttachmentRelativeLocation();
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

  public void PostInit(Vehicle in_parent, string in_position)
  {
    //called from the loco to initialize attachment settings
    ParentVehicle = in_parent;
    Position = in_position;
    CachedRelativeLocation = GetAttachmentRelativeLocation();
    TrainzScript.Log("cached location " + CachedRelativeLocation.AsString());
  }

  float lerp(float start, float end, float along)
  {
    return (end - start) * along + start;
  }

  Coordinate lerpCoordinate(Coordinate start, Coordinate end, float along)
  {
    Coordinate NewCoord = new Coordinate();
    NewCoord.x = lerp(start.x, end.x, along);
    NewCoord.y = lerp(start.y, end.y, along);
    NewCoord.z = lerp(start.z, end.z, along);
    return NewCoord;
  }

  void SetMidLength(float inframe)
  {
    float defaultlength = Str.ToFloat(Lengths.GetNamedTag("link1"));
    float offset = lerp(0.0, 0.2, inframe / 100.0);
    IKSystem.SetLinkLength(1, defaultlength + offset);
  }

  Coordinate CopyCoordinate(Coordinate in_coord)
  {
    Coordinate NewCoord = new Coordinate();
    NewCoord.x = in_coord.x;
    NewCoord.y = in_coord.y;
    NewCoord.z = in_coord.z;
    return NewCoord;
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

  Coordinate GetAttachmentRelativeLocation() //verified working
  {
    Asset vehicleasset = ParentVehicle.GetAsset();
    //AsyncQueryHelper configcache = vehicleasset.CacheConfigSoup();
    //configcache.SynchronouslyWaitForResults();
    Soup dataContainer = vehicleasset.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("coupler-locations");
    Coordinate RelativeLocation = new Coordinate();
    string[] Coords = Str.Tokens(dataContainer.GetNamedTag(Position), ",");
    RelativeLocation.x = Str.ToFloat(Coords[0]);
    RelativeLocation.y = Str.ToFloat(Coords[1]);
    RelativeLocation.z = Str.ToFloat(Coords[2]);
    return RelativeLocation;
  }


  Coordinate GetAttachmentAbsoluteLocation(IKCoupler TargetAttachment)
  {
    Coordinate ParentLocation = WorldCoordinateToCoordinate(TargetAttachment.ParentVehicle.GetMapObjectPosition());
    Orientation ParentRotation = TargetAttachment.ParentVehicle.GetMapObjectOrientation();

    //Coordinate RelativeLocation = GetAttachmentRelativeLocation(TargetAttachment);
    Coordinate RelativeLocation = CopyCoordinate(TargetAttachment.CachedRelativeLocation);
    //TrainzScript.Log("relative start " + RelativeLocation.AsString() + " around " + (string)ParentRotation.rx + " " + (string)ParentRotation.ry + " " + (string)ParentRotation.rz);
    RelativeLocation = RelativeLocation.Rotate(ParentRotation.rx, ParentRotation.ry, ParentRotation.rz);
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
    RelativeLocation = RelativeLocation.RotateBack(-MyRotation.rx, -MyRotation.ry, -MyRotation.rz);

    return RelativeLocation;
  }

  Coordinate GetFinalTarget()
  {
    Coordinate RelativeLocation = GetRelativeCoordinates(coupled);
    if(Position == "back")
    {
      RelativeLocation.y = -RelativeLocation.y;
    }
    RelativeLocation.y = RelativeLocation.y + 0.28;
    return RelativeLocation;
  }

define float ANIMATION_HEIGHT_OFFSET = 0.1;
define float UP_LENGTH = 20.0;
define float ALONG_LENGTH = 40.0;
define float SPIN_LENGTH = 100.0;
  public thread void CoupleTo(IKCoupler OtherAttachment)
  {
    TrainzScript.Log("COUPLING TO");
    Coordinate StartCoordinate = CopyCoordinate(CoupleTarget);
    if(OtherAttachment)
    {
      coupled = OtherAttachment;
      //Coordinate RelativeLocation = GetRelativeCoordinates(OtherAttachment);
      //CoupleTarget.x = RelativeLocation.x;
      //CoupleTarget.y = -RelativeLocation.y + 0.2;
      //CoupleTarget.z = RelativeLocation.z;
      //TrainzScript.Log("relative location " + RelativeLocation.AsString());
    }
    else
    {
      CoupleTarget.y = -1.0;
      CoupleTarget.z = 0.0;
    }
    if(OtherAttachment)
    {
      //Animation
      //200 frames
      Animating = true;
      float StartLength = MidLength;
      int i;

      Coordinate MidCoordinate = CopyCoordinate(StartCoordinate);
      MidCoordinate.z = MidCoordinate.z + ANIMATION_HEIGHT_OFFSET;
      for(i = 0; i < UP_LENGTH; i++)
      {
        CoupleTarget = lerpCoordinate(StartCoordinate, MidCoordinate, ((float)i / UP_LENGTH));
        Sleep(1.0 / 60.0);
      }
      Sleep(0.4);
      Coordinate EndCoordinate;
      for(i = 0; i < ALONG_LENGTH; i++)
      {
        EndCoordinate = GetFinalTarget(); //refine each frame
        EndCoordinate.z = EndCoordinate.z + ANIMATION_HEIGHT_OFFSET;
        CoupleTarget = lerpCoordinate(MidCoordinate, EndCoordinate, ((float)i / ALONG_LENGTH));
        Sleep(1.0 / 60.0);
      }
      for(i = 0; i < UP_LENGTH; i++)
      {
        Coordinate EndDownCoordinate = GetFinalTarget(); //refine each frame
        CoupleTarget = lerpCoordinate(EndCoordinate, EndDownCoordinate, ((float)i / UP_LENGTH));
        Sleep(1.0 / 60.0);
      }
      for(i = 0; i < SPIN_LENGTH; i++)
      {
        MidLength = lerp(StartLength, 0.8, ((float)i / SPIN_LENGTH));
        Sleep(1.0 / 60.0);
      }
      Animating = false;
    }
  }

  public thread void DecoupleFrom(IKCoupler OtherAttachment)
  {
    TrainzScript.Log("COUPLING FROM");
    Coordinate StartCoordinate = CopyCoordinate(CoupleTarget);
    bool WasCoupled = (coupled != null);
    coupled = null;
    //if(OtherAttachment)
    //{
      //CoupleTarget.y = -0.1;
      //CoupleTarget.z = 0.0;
    //}
    //else
    //{
      //CoupleTarget.y = -0.1;
      //CoupleTarget.z = 0.0;
    //}

    if(OtherAttachment and WasCoupled)
    {
      //Animation
      //200 frames
      Animating = true;
      float StartLength = MidLength;
      int i;

      Coordinate MidCoordinate = CopyCoordinate(StartCoordinate);
      MidCoordinate.z = MidCoordinate.z + ANIMATION_HEIGHT_OFFSET;
      for(i = 0; i < SPIN_LENGTH; i++)
      {
        MidLength = lerp(StartLength, 0.0, ((float)i / SPIN_LENGTH));
        Sleep(1.0 / 60.0);
      }
      for(i = 0; i < UP_LENGTH; i++)
      {
        CoupleTarget = lerpCoordinate(StartCoordinate, MidCoordinate, ((float)i / UP_LENGTH));
        Sleep(1.0 / 60.0);
      }
      //Sleep(0.4);
      //Coordinate EndCoordinate = CopyCoordinate(CoupleTarget);
      Coordinate EndCoordinate = new Coordinate();
      EndCoordinate.x = 0.0;
      EndCoordinate.y = -0.1;
      EndCoordinate.z = ANIMATION_HEIGHT_OFFSET;
      for(i = 0; i < ALONG_LENGTH; i++)
      {
        CoupleTarget = lerpCoordinate(MidCoordinate, EndCoordinate, ((float)i / ALONG_LENGTH));
        Sleep(1.0 / 60.0);
      }
      Coordinate EndDownCoordinate = new Coordinate();
      EndDownCoordinate.x = 0.0;
      EndDownCoordinate.y = -0.1;
      EndDownCoordinate.z = 0.0;
      for(i = 0; i < UP_LENGTH; i++)
      {
        CoupleTarget = lerpCoordinate(EndCoordinate, EndDownCoordinate, ((float)i / UP_LENGTH));
        Sleep(1.0 / 60.0);
      }
      CoupleTarget.y = -0.1;
      CoupleTarget.z = 0.0;
      Animating = false;
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
      if(!Animating and coupled != null)
      {
        Coordinate RelativeLocation = GetFinalTarget();
        CoupleTarget.x = RelativeLocation.x;
        CoupleTarget.y = RelativeLocation.y;
        CoupleTarget.z = RelativeLocation.z; // + 0.028
        //TrainzScript.Log("target location " + CoupleTarget.AsString());
      }
      SetCoupleTarget(CoupleTarget.x, CoupleTarget.y, CoupleTarget.z, MidLength * 100.0);
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
