include "gs.gs"

class Noise
{
  int[] hash;
  float[] hashvectf;
  void InitHashTable();

  public void Init()
  {
    hash = new int[512];
    hashvectf = new float[768];
    InitHashTable();
  }

  float floor(float x)
  {
    if (x >= 0)
      return (float)(int)x;
    return (float)(int)(x + 0.0001) - 1;
  }

  // Noise functions from Blender, to match the Maya wobble described in the animation doc
  float orgBlenderNoise(float x, float y, float z)
  {
    float cn1, cn2, cn3, cn4, cn5, cn6, i;
    int h;
    float fx, fy, fz, ox, oy, oz, jx, jy, jz;
    float n = 0.5;
    int ix, iy, iz, b00, b01, b10, b11, b20, b21;
  
    fx = floor(x);
    fy = floor(y);
    fz = floor(z);
  
    ox = x - fx;
    oy = y - fy;
    oz = z - fz;
  
    ix = (int)fx;
    iy = (int)fy;
    iz = (int)fz;
  
    jx = ox - 1;
    jy = oy - 1;
    jz = oz - 1;
  
    cn1 = ox * ox;
    cn2 = oy * oy;
    cn3 = oz * oz;
    cn4 = jx * jx;
    cn5 = jy * jy;
    cn6 = jz * jz;
  
    cn1 = 1.0 - 3.0 * cn1 + 2.0 * cn1 * ox;
    cn2 = 1.0 - 3.0 * cn2 + 2.0 * cn2 * oy;
    cn3 = 1.0 - 3.0 * cn3 + 2.0 * cn3 * oz;
    cn4 = 1.0 - 3.0 * cn4 - 2.0 * cn4 * jx;
    cn5 = 1.0 - 3.0 * cn5 - 2.0 * cn5 * jy;
    cn6 = 1.0 - 3.0 * cn6 - 2.0 * cn6 * jz;
  
    b00 = hash[hash[ix & 255] + (iy & 255)];
    b10 = hash[hash[(ix + 1) & 255] + (iy & 255)];
    b01 = hash[hash[ix & 255] + ((iy + 1) & 255)];
    b11 = hash[hash[(ix + 1) & 255] + ((iy + 1) & 255)];
  
    b20 = iz & 255;
    b21 = (iz + 1) & 255;
  
    /* 0 */
    i = (cn1 * cn2 * cn3);
    h = 3 * hash[b20 + b00];
    n = n + (i * (hashvectf[h + 0] * ox + hashvectf[h + 1] * oy + hashvectf[h + 2] * oz));
    /* 1 */
    i = (cn1 * cn2 * cn6);
    h = 3 * hash[b21 + b00];
    n = n + (i * (hashvectf[h + 0] * ox + hashvectf[h + 1] * oy + hashvectf[h + 2] * jz));
    /* 2 */
    i = (cn1 * cn5 * cn3);
    h = 3 * hash[b20 + b01];
    n = n + (i * (hashvectf[h + 0] * ox + hashvectf[h + 1] * jy + hashvectf[h + 2] * oz));
    /* 3 */
    i = (cn1 * cn5 * cn6);
    h = 3 * hash[b21 + b01];
    n = n + (i * (hashvectf[h + 0] * ox + hashvectf[h + 1] * jy + hashvectf[h + 2] * jz));
    /* 4 */
    i = cn4 * cn2 * cn3;
    h = 3 * hash[b20 + b10];
    n = n + (i * (hashvectf[h + 0] * jx + hashvectf[h + 1] * oy + hashvectf[h + 2] * oz));
    /* 5 */
    i = cn4 * cn2 * cn6;
    h = 3 * hash[b21 + b10];
    n = n + (i * (hashvectf[h + 0] * jx + hashvectf[h + 1] * oy + hashvectf[h + 2] * jz));
    /* 6 */
    i = cn4 * cn5 * cn3;
    h = 3 * hash[b20 + b11];
    n = n + (i * (hashvectf[h + 0] * jx + hashvectf[h + 1] * jy + hashvectf[h + 2] * oz));
    /* 7 */
    i = (cn4 * cn5 * cn6);
    h = 3 * hash[b21 + b11];
    n = n + (i * (hashvectf[h + 0] * jx + hashvectf[h + 1] * jy + hashvectf[h + 2] * jz));
  
    if (n < 0.0f) {
      n = 0.0f;
    }
    else if (n > 1.0f) {
      n = 1.0f;
    }
    return n;
  }

  float hnoise(float noisesize, float x, float y, float z)
  {
    if (noisesize == 0.0) {
      return 0.0;
    }
    x = (1.0f + x) / noisesize;
    y = (1.0f + y) / noisesize;
    z = (1.0f + z) / noisesize;
    return orgBlenderNoise(x, y, z);
  }

  public float turbulence_noise(float noisesize, float x, float y, float z, int nr)
  {
    float s;
    float d = 0.5;
    float div = 1.0;
    s = hnoise(noisesize, x, y, z);

    while (nr > 0) {
  
      s = s + d * hnoise(noisesize * d, x, y, z);
      div = div + d;
      d = d * 0.5f;
  
      nr--;
    }
    return s / div;
  }

  void InitHashTable()
  {
    hash[0  ] = 0xA2; hash[1  ] = 0xA0; hash[2  ] = 0x19; hash[3  ] = 0x3B; hash[4  ] = 0xF8; hash[5  ] = 0xEB; hash[6  ] = 0xAA; hash[7  ] = 0xEE; hash[8  ] = 0xF3; hash[9  ] = 0x1C; hash[10 ] = 0x67; hash[11 ] = 0x28; hash[12 ] = 0x1D; hash[13 ] = 0xED; hash[14 ] = 0x0; hash[15 ] =  0xDE;
    hash[16 ] = 0x95; hash[17 ] = 0x2E; hash[18 ] = 0xDC; hash[19 ] = 0x3F; hash[20 ] = 0x3A; hash[21 ] = 0x82; hash[22 ] = 0x35; hash[23 ] = 0x4D; hash[24 ] = 0x6C; hash[25 ] = 0xBA; hash[26 ] = 0x36; hash[27 ] = 0xD0; hash[28 ] = 0xF6; hash[29 ] = 0xC;  hash[30 ] =  0x79;hash[31 ] = 0x32;
    hash[32 ] = 0xD1; hash[33 ] = 0x59; hash[34 ] = 0xF4; hash[35 ] = 0x8;  hash[36 ] =  0x8B;hash[37 ] = 0x63; hash[38 ] = 0x89; hash[39 ] = 0x2F; hash[40 ] = 0xB8; hash[41 ] = 0xB4; hash[42 ] = 0x97; hash[43 ] = 0x83; hash[44 ] = 0xF2; hash[45 ] = 0x8F; hash[46 ] = 0x18; hash[47 ] = 0xC7;
    hash[48 ] = 0x51; hash[49 ] = 0x14; hash[50 ] = 0x65; hash[51 ] = 0x87; hash[52 ] = 0x48; hash[53 ] = 0x20; hash[54 ] = 0x42; hash[55 ] = 0xA8; hash[56 ] = 0x80; hash[57 ] = 0xB5; hash[58 ] = 0x40; hash[59 ] = 0x13; hash[60 ] = 0xB2; hash[61 ] = 0x22; hash[62 ] = 0x7E; hash[63 ] = 0x57;
    hash[64 ] = 0xBC; hash[65 ] = 0x7F; hash[66 ] = 0x6B; hash[67 ] = 0x9D; hash[68 ] = 0x86; hash[69 ] = 0x4C; hash[70 ] = 0xC8; hash[71 ] = 0xDB; hash[72 ] = 0x7C; hash[73 ] = 0xD5; hash[74 ] = 0x25; hash[75 ] = 0x4E; hash[76 ] = 0x5A; hash[77 ] = 0x55; hash[78 ] = 0x74; hash[79 ] = 0x50;
    hash[80 ] = 0xCD; hash[81 ] = 0xB3; hash[82 ] = 0x7A; hash[83 ] = 0xBB; hash[84 ] = 0xC3; hash[85 ] = 0xCB; hash[86 ] = 0xB6; hash[87 ] = 0xE2; hash[88 ] = 0xE4; hash[89 ] = 0xEC; hash[90 ] = 0xFD; hash[91 ] = 0x98; hash[92 ] = 0xB;  hash[93 ] =  0x96;hash[94 ] = 0xD3; hash[95 ] = 0x9E;
    hash[96 ] = 0x5C; hash[97 ] = 0xA1; hash[98 ] = 0x64; hash[99 ] = 0xF1; hash[100] = 0x81; hash[101] = 0x61; hash[102] = 0xE1; hash[103] = 0xC4; hash[104] = 0x24; hash[105] = 0x72; hash[106] = 0x49; hash[107] = 0x8C; hash[108] = 0x90; hash[109] = 0x4B; hash[110] = 0x84; hash[111] = 0x34;
    hash[112] = 0x38; hash[113] = 0xAB; hash[114] = 0x78; hash[115] = 0xCA; hash[116] = 0x1F; hash[117] = 0x1;  hash[118] =  0xD7;hash[119] = 0x93; hash[120] = 0x11; hash[121] = 0xC1; hash[122] = 0x58; hash[123] = 0xA9; hash[124] = 0x31; hash[125] = 0xF9; hash[126] = 0x44; hash[127] = 0x6D;
    hash[128] = 0xBF; hash[129] = 0x33; hash[130] = 0x9C; hash[131] = 0x5F; hash[132] = 0x9;  hash[133] =  0x94;hash[134] = 0xA3; hash[135] = 0x85; hash[136] = 0x6;  hash[137] =  0xC6;hash[138] = 0x9A; hash[139] = 0x1E; hash[140] = 0x7B; hash[141] = 0x46; hash[142] = 0x15; hash[143] = 0x30;
    hash[144] = 0x27; hash[145] = 0x2B; hash[146] = 0x1B; hash[147] = 0x71; hash[148] = 0x3C; hash[149] = 0x5B; hash[150] = 0xD6; hash[151] = 0x6F; hash[152] = 0x62; hash[153] = 0xAC; hash[154] = 0x4F; hash[155] = 0xC2; hash[156] = 0xC0; hash[157] = 0xE;  hash[158] =  0xB1;hash[159] = 0x23;
    hash[160] = 0xA7; hash[161] = 0xDF; hash[162] = 0x47; hash[163] = 0xB0; hash[164] = 0x77; hash[165] = 0x69; hash[166] = 0x5;  hash[167] =  0xE9;hash[168] = 0xE6; hash[169] = 0xE7; hash[170] = 0x76; hash[171] = 0x73; hash[172] = 0xF;  hash[173] =  0xFE;hash[174] = 0x6E; hash[175] = 0x9B;
    hash[176] = 0x56; hash[177] = 0xEF; hash[178] = 0x12; hash[179] = 0xA5; hash[180] = 0x37; hash[181] = 0xFC; hash[182] = 0xAE; hash[183] = 0xD9; hash[184] = 0x3;  hash[185] =  0x8E;hash[186] = 0xDD; hash[187] = 0x10; hash[188] = 0xB9; hash[189] = 0xCE; hash[190] = 0xC9; hash[191] = 0x8D;
    hash[192] = 0xDA; hash[193] = 0x2A; hash[194] = 0xBD; hash[195] = 0x68; hash[196] = 0x17; hash[197] = 0x9F; hash[198] = 0xBE; hash[199] = 0xD4; hash[200] = 0xA;  hash[201] =  0xCC;hash[202] = 0xD2; hash[203] = 0xE8; hash[204] = 0x43; hash[205] = 0x3D; hash[206] = 0x70; hash[207] = 0xB7;
    hash[208] = 0x2;  hash[209] =  0x7D;hash[210] = 0x99; hash[211] = 0xD8; hash[212] = 0xD;  hash[213] =  0x60;hash[214] = 0x8A; hash[215] = 0x4;  hash[216] =  0x2C;hash[217] = 0x3E; hash[218] = 0x92; hash[219] = 0xE5; hash[220] = 0xAF; hash[221] = 0x53; hash[222] = 0x7;  hash[223] =  0xE0;
    hash[224] = 0x29; hash[225] = 0xA6; hash[226] = 0xC5; hash[227] = 0xE3; hash[228] = 0xF5; hash[229] = 0xF7; hash[230] = 0x4A; hash[231] = 0x41; hash[232] = 0x26; hash[233] = 0x6A; hash[234] = 0x16; hash[235] = 0x5E; hash[236] = 0x52; hash[237] = 0x2D; hash[238] = 0x21; hash[239] = 0xAD;
    hash[240] = 0xF0; hash[241] = 0x91; hash[242] = 0xFF; hash[243] = 0xEA; hash[244] = 0x54; hash[245] = 0xFA; hash[246] = 0x66; hash[247] = 0x1A; hash[248] = 0x45; hash[249] = 0x39; hash[250] = 0xCF; hash[251] = 0x75; hash[252] = 0xA4; hash[253] = 0x88; hash[254] = 0xFB; hash[255] = 0x5D;
    hash[256] = 0xA2; hash[257] = 0xA0; hash[258] = 0x19; hash[259] = 0x3B; hash[260] = 0xF8; hash[261] = 0xEB; hash[262] = 0xAA; hash[263] = 0xEE; hash[264] = 0xF3; hash[265] = 0x1C; hash[266] = 0x67; hash[267] = 0x28; hash[268] = 0x1D; hash[269] = 0xED; hash[270] = 0x0;  hash[271] =  0xDE;
    hash[272] = 0x95; hash[273] = 0x2E; hash[274] = 0xDC; hash[275] = 0x3F; hash[276] = 0x3A; hash[277] = 0x82; hash[278] = 0x35; hash[279] = 0x4D; hash[280] = 0x6C; hash[281] = 0xBA; hash[282] = 0x36; hash[283] = 0xD0; hash[284] = 0xF6; hash[285] = 0xC;  hash[286] =  0x79;hash[287] = 0x32;
    hash[288] = 0xD1; hash[289] = 0x59; hash[290] = 0xF4; hash[291] = 0x8;  hash[292] =  0x8B;hash[293] = 0x63; hash[294] = 0x89; hash[295] = 0x2F; hash[296] = 0xB8; hash[297] = 0xB4; hash[298] = 0x97; hash[299] = 0x83; hash[300] = 0xF2; hash[301] = 0x8F; hash[302] = 0x18; hash[303] = 0xC7;
    hash[304] = 0x51; hash[305] = 0x14; hash[306] = 0x65; hash[307] = 0x87; hash[308] = 0x48; hash[309] = 0x20; hash[310] = 0x42; hash[311] = 0xA8; hash[312] = 0x80; hash[313] = 0xB5; hash[314] = 0x40; hash[315] = 0x13; hash[316] = 0xB2; hash[317] = 0x22; hash[318] = 0x7E; hash[319] = 0x57;
    hash[320] = 0xBC; hash[321] = 0x7F; hash[322] = 0x6B; hash[323] = 0x9D; hash[324] = 0x86; hash[325] = 0x4C; hash[326] = 0xC8; hash[327] = 0xDB; hash[328] = 0x7C; hash[329] = 0xD5; hash[330] = 0x25; hash[331] = 0x4E; hash[332] = 0x5A; hash[333] = 0x55; hash[334] = 0x74; hash[335] = 0x50;
    hash[336] = 0xCD; hash[337] = 0xB3; hash[338] = 0x7A; hash[339] = 0xBB; hash[340] = 0xC3; hash[341] = 0xCB; hash[342] = 0xB6; hash[343] = 0xE2; hash[344] = 0xE4; hash[345] = 0xEC; hash[346] = 0xFD; hash[347] = 0x98; hash[348] = 0xB;  hash[349] =  0x96;hash[350] = 0xD3; hash[351] = 0x9E;
    hash[352] = 0x5C; hash[353] = 0xA1; hash[354] = 0x64; hash[355] = 0xF1; hash[356] = 0x81; hash[357] = 0x61; hash[358] = 0xE1; hash[359] = 0xC4; hash[360] = 0x24; hash[361] = 0x72; hash[362] = 0x49; hash[363] = 0x8C; hash[364] = 0x90; hash[365] = 0x4B; hash[366] = 0x84; hash[367] = 0x34;
    hash[368] = 0x38; hash[369] = 0xAB; hash[370] = 0x78; hash[371] = 0xCA; hash[372] = 0x1F; hash[373] = 0x1;  hash[374] =  0xD7;hash[375] = 0x93; hash[376] = 0x11; hash[377] = 0xC1; hash[378] = 0x58; hash[379] = 0xA9; hash[380] = 0x31; hash[381] = 0xF9; hash[382] = 0x44; hash[383] = 0x6D;
    hash[384] = 0xBF; hash[385] = 0x33; hash[386] = 0x9C; hash[387] = 0x5F; hash[388] = 0x9;  hash[389] =  0x94;hash[390] = 0xA3; hash[391] = 0x85; hash[392] = 0x6;  hash[393] =  0xC6;hash[394] = 0x9A; hash[395] = 0x1E; hash[396] = 0x7B; hash[397] = 0x46; hash[398] = 0x15; hash[399] = 0x30;
    hash[400] = 0x27; hash[401] = 0x2B; hash[402] = 0x1B; hash[403] = 0x71; hash[404] = 0x3C; hash[405] = 0x5B; hash[406] = 0xD6; hash[407] = 0x6F; hash[408] = 0x62; hash[409] = 0xAC; hash[410] = 0x4F; hash[411] = 0xC2; hash[412] = 0xC0; hash[413] = 0xE;  hash[414] =  0xB1;hash[415] = 0x23;
    hash[416] = 0xA7; hash[417] = 0xDF; hash[418] = 0x47; hash[419] = 0xB0; hash[420] = 0x77; hash[421] = 0x69; hash[422] = 0x5;  hash[423] =  0xE9;hash[424] = 0xE6; hash[425] = 0xE7; hash[426] = 0x76; hash[427] = 0x73; hash[428] = 0xF;  hash[429] =  0xFE;hash[430] = 0x6E; hash[431] = 0x9B;
    hash[432] = 0x56; hash[433] = 0xEF; hash[434] = 0x12; hash[435] = 0xA5; hash[436] = 0x37; hash[437] = 0xFC; hash[438] = 0xAE; hash[439] = 0xD9; hash[440] = 0x3;  hash[441] =  0x8E;hash[442] = 0xDD; hash[443] = 0x10; hash[444] = 0xB9; hash[445] = 0xCE; hash[446] = 0xC9; hash[447] = 0x8D;
    hash[448] = 0xDA; hash[449] = 0x2A; hash[450] = 0xBD; hash[451] = 0x68; hash[452] = 0x17; hash[453] = 0x9F; hash[454] = 0xBE; hash[455] = 0xD4; hash[456] = 0xA;  hash[457] =  0xCC;hash[458] = 0xD2; hash[459] = 0xE8; hash[460] = 0x43; hash[461] = 0x3D; hash[462] = 0x70; hash[463] = 0xB7;
    hash[464] = 0x2;  hash[465] =  0x7D;hash[466] = 0x99; hash[467] = 0xD8; hash[468] = 0xD;  hash[469] =  0x60;hash[470] = 0x8A; hash[471] = 0x4;  hash[472] =  0x2C;hash[473] = 0x3E; hash[474] = 0x92; hash[475] = 0xE5; hash[476] = 0xAF; hash[477] = 0x53; hash[478] = 0x7;  hash[479] =  0xE0;
    hash[480] = 0x29; hash[481] = 0xA6; hash[482] = 0xC5; hash[483] = 0xE3; hash[484] = 0xF5; hash[485] = 0xF7; hash[486] = 0x4A; hash[487] = 0x41; hash[488] = 0x26; hash[489] = 0x6A; hash[490] = 0x16; hash[491] = 0x5E; hash[492] = 0x52; hash[493] = 0x2D; hash[494] = 0x21; hash[495] = 0xAD;
    hash[496] = 0xF0; hash[497] = 0x91; hash[498] = 0xFF; hash[499] = 0xEA; hash[500] = 0x54; hash[501] = 0xFA; hash[502] = 0x66; hash[503] = 0x1A; hash[504] = 0x45; hash[505] = 0x39; hash[506] = 0xCF; hash[507] = 0x75; hash[508] = 0xA4; hash[509] = 0x88; hash[510] = 0xFB; hash[511] = 0x5D;
  
  
    
    hashvectf[0  ] = 0.33783;		  hashvectf[1  ] =0.715698;		hashvectf[2  ] =-0.611206;		hashvectf[3  ] =-0.944031;		hashvectf[4  ] =-0.326599;		hashvectf[5  ] =-0.045624;		hashvectf[6  ] =-0.101074;		hashvectf[7  ] =-0.416443;
    hashvectf[8  ] = -0.903503;		hashvectf[9  ] =0.799286;		hashvectf[10 ] =0.49411;		  hashvectf[11 ] =-0.341949;		hashvectf[12 ] =-0.854645;		hashvectf[13 ] =0.518036;		hashvectf[14 ] =0.033936;		hashvectf[15 ] =0.42514;
    hashvectf[16 ] = -0.437866;		hashvectf[17 ] =-0.792114;		hashvectf[18 ] =-0.358948;		hashvectf[19 ] =0.597046;		hashvectf[20 ] =0.717377;		hashvectf[21 ] =-0.985413;		hashvectf[22 ] =0.144714;		hashvectf[23 ] =0.089294;
    hashvectf[24 ] = -0.601776;		hashvectf[25 ] =-0.33728;		hashvectf[26 ] =-0.723907;		hashvectf[27 ] =-0.449921;		hashvectf[28 ] =0.594513;		hashvectf[29 ] =0.666382;		hashvectf[30 ] =0.208313;		hashvectf[31 ] =-0.10791;
    hashvectf[32 ] = 0.972076;		  hashvectf[33 ] =0.575317;		hashvectf[34 ] =0.060425;		hashvectf[35 ] =0.815643;		hashvectf[36 ] =0.293365;		hashvectf[37 ] =-0.875702;		hashvectf[38 ] =-0.383453;		hashvectf[39 ] =0.293762;
    hashvectf[40 ] = 0.465759;		  hashvectf[41 ] =0.834686;		hashvectf[42 ] =-0.846008;		hashvectf[43 ] =-0.233398;		hashvectf[44 ] =-0.47934;		hashvectf[45 ] =-0.115814;		hashvectf[46 ] =0.143036;		hashvectf[47 ] =-0.98291;
    hashvectf[48 ] = 0.204681;		  hashvectf[49 ] =-0.949036;		hashvectf[50 ] =-0.239532;		hashvectf[51 ] =0.946716;		hashvectf[52 ] =-0.263947;		hashvectf[53 ] =0.184326;		hashvectf[54 ] =-0.235596;		hashvectf[55 ] =0.573822;
    hashvectf[56 ] = 0.784332;		  hashvectf[57 ] =0.203705;		hashvectf[58 ] =-0.372253;		hashvectf[59 ] =-0.905487;		hashvectf[60 ] =0.756989;		hashvectf[61 ] =-0.651031;		hashvectf[62 ] =0.055298;		hashvectf[63 ] =0.497803;
    hashvectf[64 ] = 0.814697;		  hashvectf[65 ] =-0.297363;		hashvectf[66 ] =-0.16214;		hashvectf[67 ] =0.063995;		hashvectf[68 ] =-0.98468;		hashvectf[69 ] =-0.329254;		hashvectf[70 ] =0.834381;		hashvectf[71 ] =0.441925;
    hashvectf[72 ] = 0.703827;		  hashvectf[73 ] =-0.527039;		hashvectf[74 ] =-0.476227;		hashvectf[75 ] =0.956421;		hashvectf[76 ] =0.266113;		hashvectf[77 ] =0.119781;		hashvectf[78 ] =0.480133;		hashvectf[79 ] =0.482849;
    hashvectf[80 ] = 0.7323;		    hashvectf[81 ] =-0.18631;		hashvectf[82 ] =0.961212;		hashvectf[83 ] =-0.203125;		hashvectf[84 ] =-0.748474;		hashvectf[85 ] =-0.656921;		hashvectf[86 ] =-0.090393;		hashvectf[87 ] =-0.085052;
    hashvectf[88 ] = -0.165253;		hashvectf[89 ] =0.982544;		hashvectf[90 ] =-0.76947;		hashvectf[91 ] =0.628174;		hashvectf[92 ] =-0.115234;		hashvectf[93 ] =0.383148;		hashvectf[94 ] =0.537659;		hashvectf[95 ] =0.751068;
    hashvectf[96 ] = 0.616486;		  hashvectf[97 ] =-0.668488;		hashvectf[98 ] =-0.415924;		hashvectf[99 ] =-0.259979;		hashvectf[100] =-0.630005;		hashvectf[101] =0.73175;		  hashvectf[102] =0.570953;		hashvectf[103] =-0.087952;
    hashvectf[104] = 0.816223;		  hashvectf[105] =-0.458008;		hashvectf[106] =0.023254;		hashvectf[107] =0.888611;		hashvectf[108] =-0.196167;		hashvectf[109] =0.976563;		hashvectf[110] =-0.088287;		hashvectf[111] =-0.263885;
    hashvectf[112] = -0.69812;		  hashvectf[113] =-0.665527;		hashvectf[114] =0.437134;		hashvectf[115] =-0.892273;		hashvectf[116] =-0.112793;		hashvectf[117] =-0.621674;		hashvectf[118] =-0.230438;		hashvectf[119] =0.748566;
    hashvectf[120] = 0.232422;		  hashvectf[121] =0.900574;		hashvectf[122] =-0.367249;		hashvectf[123] =0.22229;		  hashvectf[124] =-0.796143;		hashvectf[125] =0.562744;		hashvectf[126] =-0.665497;		hashvectf[127] =-0.73764;
    hashvectf[128] = 0.11377;		  hashvectf[129] =0.670135;		hashvectf[130] =0.704803;		hashvectf[131] =0.232605;		hashvectf[132] =0.895599;		hashvectf[133] =0.429749;		hashvectf[134] =-0.114655;		hashvectf[135] =-0.11557;
    hashvectf[136] = -0.474243;		hashvectf[137] =0.872742;		hashvectf[138] =0.621826;		hashvectf[139] =0.604004;		hashvectf[140] =-0.498444;		hashvectf[141] =-0.832214;		hashvectf[142] =0.012756;		hashvectf[143] =0.55426;
    hashvectf[144] = -0.702484;		hashvectf[145] =0.705994;		hashvectf[146] =-0.089661;		hashvectf[147] =-0.692017;		hashvectf[148] =0.649292;		hashvectf[149] =0.315399;		hashvectf[150] =-0.175995;		hashvectf[151] =-0.977997;
    hashvectf[152] = 0.111877;		  hashvectf[153] =0.096954;		hashvectf[154] =-0.04953;		hashvectf[155] =0.994019;		hashvectf[156] =0.635284;		hashvectf[157] =-0.606689;		hashvectf[158] =-0.477783;		hashvectf[159] =-0.261261;
    hashvectf[160] = -0.607422;		hashvectf[161] =-0.750153;		hashvectf[162] =0.983276;		hashvectf[163] =0.165436;		hashvectf[164] =0.075958;		hashvectf[165] =-0.29837;		hashvectf[166] =0.404083;		hashvectf[167] =-0.864655;
    hashvectf[168] = -0.638672;		hashvectf[169] =0.507721;		hashvectf[170] =0.578156;		hashvectf[171] =0.388214;		hashvectf[172] =0.412079;		hashvectf[173] =0.824249;		hashvectf[174] =0.556183;		hashvectf[175] =-0.208832;
    hashvectf[176] = 0.804352;		  hashvectf[177] =0.778442;		hashvectf[178] =0.562012;		hashvectf[179] =0.27951;		  hashvectf[180] =-0.616577;		hashvectf[181] =0.781921;		hashvectf[182] =-0.091522;		hashvectf[183] =0.196289;
    hashvectf[184] = 0.051056;		  hashvectf[185] =0.979187;		hashvectf[186] =-0.121216;		hashvectf[187] =0.207153;		hashvectf[188] =-0.970734;		hashvectf[189] =-0.173401;		hashvectf[190] =-0.384735;		hashvectf[191] =0.906555;
    hashvectf[192] = 0.161499;		  hashvectf[193] =-0.723236;		hashvectf[194] =-0.671387;		hashvectf[195] =0.178497;		hashvectf[196] =-0.006226;		hashvectf[197] =-0.983887;		hashvectf[198] =-0.126038;		hashvectf[199] =0.15799;
    hashvectf[200] = 0.97934;		  hashvectf[201] =0.830475;		hashvectf[202] =-0.024811;		hashvectf[203] =0.556458;		hashvectf[204] =-0.510132;		hashvectf[205] =-0.76944;		hashvectf[206] =0.384247;		hashvectf[207] =0.81424;
    hashvectf[208] = 0.200104;		  hashvectf[209] =-0.544891;		hashvectf[210] =-0.112549;		hashvectf[211] =-0.393311;		hashvectf[212] =-0.912445;		hashvectf[213] =0.56189;		  hashvectf[214] =0.152222;		hashvectf[215] =-0.813049;
    hashvectf[216] = 0.198914;		  hashvectf[217] =-0.254517;		hashvectf[218] =-0.946381;		hashvectf[219] =-0.41217;		hashvectf[220] =0.690979;		hashvectf[221] =-0.593811;		hashvectf[222] =-0.407257;		hashvectf[223] =0.324524;
    hashvectf[224] = 0.853668;		  hashvectf[225] =-0.690186;		hashvectf[226] =0.366119;		hashvectf[227] =-0.624115;		hashvectf[228] =-0.428345;		hashvectf[229] =0.844147;		hashvectf[230] =-0.322296;		hashvectf[231] =-0.21228;
    hashvectf[232] = -0.297546;		hashvectf[233] =-0.930756;		hashvectf[234] =-0.273071;		hashvectf[235] =0.516113;		hashvectf[236] =0.811798;		hashvectf[237] =0.928314;		hashvectf[238] =0.371643;		hashvectf[239] =0.007233;
    hashvectf[240] = 0.785828;		  hashvectf[241] =-0.479218;		hashvectf[242] =-0.390778;		hashvectf[243] =-0.704895;		hashvectf[244] =0.058929;		hashvectf[245] =0.706818;		hashvectf[246] =0.173248;		hashvectf[247] =0.203583;
    hashvectf[248] = 0.963562;		  hashvectf[249] =0.422211;		hashvectf[250] =-0.904297;		hashvectf[251] =-0.062469;		hashvectf[252] =-0.363312;		hashvectf[253] =-0.182465;		hashvectf[254] =0.913605;		hashvectf[255] =0.254028;
    hashvectf[256] = -0.552307;		hashvectf[257] =-0.793945;		hashvectf[258] =-0.28891;		hashvectf[259] =-0.765747;		hashvectf[260] =-0.574554;		hashvectf[261] =0.058319;		hashvectf[262] =0.291382;		hashvectf[263] =0.954803;
    hashvectf[264] = 0.946136;		  hashvectf[265] =-0.303925;		hashvectf[266] =0.111267;		hashvectf[267] =-0.078156;		hashvectf[268] =0.443695;		hashvectf[269] =-0.892731;		hashvectf[270] =0.182098;		hashvectf[271] =0.89389;
    hashvectf[272] = 0.409515;		  hashvectf[273] =-0.680298;		hashvectf[274] =-0.213318;		hashvectf[275] =0.701141;		hashvectf[276] =0.062469;		hashvectf[277] =0.848389;		hashvectf[278] =-0.525635;		hashvectf[279] =-0.72879;
    hashvectf[280] = -0.641846;		hashvectf[281] =0.238342;		hashvectf[282] =-0.88089;		hashvectf[283] =0.427673;		hashvectf[284] =0.202637;		hashvectf[285] =-0.532501;		hashvectf[286] =-0.21405;		hashvectf[287] =0.818878;
    hashvectf[288] = 0.948975;		  hashvectf[289] =-0.305084;		hashvectf[290] =0.07962;		  hashvectf[291] =0.925446;		hashvectf[292] =0.374664;		hashvectf[293] =0.055817;		hashvectf[294] =0.820923;		hashvectf[295] =0.565491;
    hashvectf[296] = 0.079102;		  hashvectf[297] =0.25882;		  hashvectf[298] =0.099792;		hashvectf[299] =-0.960724;		hashvectf[300] =-0.294617;		hashvectf[301] =0.910522;		hashvectf[302] =0.289978;		hashvectf[303] =0.137115;
    hashvectf[304] = 0.320038;		  hashvectf[305] =-0.937408;		hashvectf[306] =-0.908386;		hashvectf[307] =0.345276;		hashvectf[308] =-0.235718;		hashvectf[309] =-0.936218;		hashvectf[310] =0.138763;		hashvectf[311] =0.322754;
    hashvectf[312] = 0.366577;		  hashvectf[313] =0.925934;		hashvectf[314] =-0.090637;		hashvectf[315] =0.309296;		hashvectf[316] =-0.686829;		hashvectf[317] =-0.657684;		hashvectf[318] =0.66983;		  hashvectf[319] =0.024445;
    hashvectf[320] = 0.742065;		  hashvectf[321] =-0.917999;		hashvectf[322] =-0.059113;		hashvectf[323] =-0.392059;		hashvectf[324] =0.365509;		hashvectf[325] =0.462158;		hashvectf[326] =-0.807922;		hashvectf[327] =0.083374;
    hashvectf[328] = 0.996399;		  hashvectf[329] =-0.014801;		hashvectf[330] =0.593842;		hashvectf[331] =0.253143;		hashvectf[332] =-0.763672;		hashvectf[333] =0.974976;		hashvectf[334] =-0.165466;		hashvectf[335] =0.148285;
    hashvectf[336] = 0.918976;		  hashvectf[337] =0.137299;		hashvectf[338] =0.369537;		hashvectf[339] =0.294952;		hashvectf[340] =0.694977;		hashvectf[341] =0.655731;		hashvectf[342] =0.943085;		hashvectf[343] =0.152618;
    hashvectf[344] = -0.295319;		hashvectf[345] =0.58783;		  hashvectf[346] =-0.598236;		hashvectf[347] =0.544495;		hashvectf[348] =0.203796;		hashvectf[349] =0.678223;		hashvectf[350] =0.705994;		hashvectf[351] =-0.478821;
    hashvectf[352] = -0.661011;		hashvectf[353] =0.577667;		hashvectf[354] =0.719055;		hashvectf[355] =-0.1698;		  hashvectf[356] =-0.673828;		hashvectf[357] =-0.132172;		hashvectf[358] =-0.965332;		hashvectf[359] =0.225006;
    hashvectf[360] = -0.981873;		hashvectf[361] =-0.14502;		hashvectf[362] =0.121979;		hashvectf[363] =0.763458;		hashvectf[364] =0.579742;		hashvectf[365] =0.284546;		hashvectf[366] =-0.893188;		hashvectf[367] =0.079681;
    hashvectf[368] = 0.442474;		  hashvectf[369] =-0.795776;		hashvectf[370] =-0.523804;		hashvectf[371] =0.303802;		hashvectf[372] =0.734955;		hashvectf[373] =0.67804;		  hashvectf[374] =-0.007446;		hashvectf[375] =0.15506;
    hashvectf[376] = 0.986267;		  hashvectf[377] =-0.056183;		hashvectf[378] =0.258026;		hashvectf[379] =0.571503;		hashvectf[380] =-0.778931;		hashvectf[381] =-0.681549;		hashvectf[382] =-0.702087;		hashvectf[383] =-0.206116;
    hashvectf[384] = -0.96286;		  hashvectf[385] =-0.177185;		hashvectf[386] =0.203613;		hashvectf[387] =-0.470978;		hashvectf[388] =-0.515106;		hashvectf[389] =0.716095;		hashvectf[390] =-0.740326;		hashvectf[391] =0.57135;
    hashvectf[392] = 0.354095;		  hashvectf[393] =-0.56012;		hashvectf[394] =-0.824982;		hashvectf[395] =-0.074982;		hashvectf[396] =-0.507874;		hashvectf[397] =0.753204;		hashvectf[398] =0.417969;		hashvectf[399] =-0.503113;
    hashvectf[400] = 0.038147;		  hashvectf[401] =0.863342;		hashvectf[402] =0.594025;		hashvectf[403] =0.673553;		hashvectf[404] =-0.439758;		hashvectf[405] =-0.119873;		hashvectf[406] =-0.005524;		hashvectf[407] =-0.992737;
    hashvectf[408] = 0.098267;		  hashvectf[409] =-0.213776;		hashvectf[410] =0.971893;		hashvectf[411] =-0.615631;		hashvectf[412] =0.643951;		hashvectf[413] =0.454163;		hashvectf[414] =0.896851;		hashvectf[415] =-0.441071;
    hashvectf[416] = 0.032166;		  hashvectf[417] =-0.555023;		hashvectf[418] =0.750763;		hashvectf[419] =-0.358093;		hashvectf[420] =0.398773;		hashvectf[421] =0.304688;		hashvectf[422] =0.864929;		hashvectf[423] =-0.722961;
    hashvectf[424] = 0.303589;		  hashvectf[425] =0.620544;		hashvectf[426] =-0.63559;		hashvectf[427] =-0.621948;		hashvectf[428] =-0.457306;		hashvectf[429] =-0.293243;		hashvectf[430] =0.072327;		hashvectf[431] =0.953278;
    hashvectf[432] = -0.491638;		hashvectf[433] =0.661041;		hashvectf[434] =-0.566772;		hashvectf[435] =-0.304199;		hashvectf[436] =-0.572083;		hashvectf[437] =-0.761688;		hashvectf[438] =0.908081;		hashvectf[439] =-0.398956;
    hashvectf[440] = 0.127014;		  hashvectf[441] =-0.523621;		hashvectf[442] =-0.549683;		hashvectf[443] =-0.650848;		hashvectf[444] =-0.932922;		hashvectf[445] =-0.19986;		hashvectf[446] =0.299408;		hashvectf[447] =0.099426;
    hashvectf[448] = 0.140869;		  hashvectf[449] =0.984985;		hashvectf[450] =-0.020325;		hashvectf[451] =-0.999756;		hashvectf[452] =-0.002319;		hashvectf[453] =0.952667;		hashvectf[454] =0.280853;		hashvectf[455] =-0.11615;
    hashvectf[456] = -0.971893;		hashvectf[457] =0.082581;		hashvectf[458] =0.220337;		hashvectf[459] =0.65921;		  hashvectf[460] =0.705292;		hashvectf[461] =-0.260651;		hashvectf[462] =0.733063;		hashvectf[463] =-0.175537;
    hashvectf[464] = 0.657043;		  hashvectf[465] =-0.555206;		hashvectf[466] =0.429504;		hashvectf[467] =-0.712189;		hashvectf[468] =0.400421;		hashvectf[469] =-0.89859;		hashvectf[470] =0.179352;		hashvectf[471] =0.750885;
    hashvectf[472] = -0.19696;		  hashvectf[473] =0.630341;		hashvectf[474] =0.785675;		hashvectf[475] =-0.569336;		hashvectf[476] =0.241821;		hashvectf[477] =-0.058899;		hashvectf[478] =-0.464111;		hashvectf[479] =0.883789;
    hashvectf[480] = 0.129608;		  hashvectf[481] =-0.94519;		hashvectf[482] =0.299622;		hashvectf[483] =-0.357819;		hashvectf[484] =0.907654;		hashvectf[485] =0.219238;		hashvectf[486] =-0.842133;		hashvectf[487] =-0.439117;
    hashvectf[488] = -0.312927;		hashvectf[489] =-0.313477;		hashvectf[490] =0.84433;		  hashvectf[491] =0.434479;		hashvectf[492] =-0.241211;		hashvectf[493] =0.053253;		hashvectf[494] =0.968994;		hashvectf[495] =0.063873;
    hashvectf[496] = 0.823273;		  hashvectf[497] =0.563965;		hashvectf[498] =0.476288;		hashvectf[499] =0.862152;		hashvectf[500] =-0.172516;		hashvectf[501] =0.620941;		hashvectf[502] =-0.298126;		hashvectf[503] =0.724915;
    hashvectf[504] = 0.25238;		  hashvectf[505] =-0.749359;		hashvectf[506] =-0.612122;		hashvectf[507] =-0.577545;		hashvectf[508] =0.386566;		hashvectf[509] =0.718994;		hashvectf[510] =-0.406342;		hashvectf[511] =-0.737976;
    hashvectf[512] = 0.538696;		  hashvectf[513] =0.04718;		  hashvectf[514] =0.556305;		hashvectf[515] =0.82959;		  hashvectf[516] =-0.802856;		hashvectf[517] =0.587463;		hashvectf[518] =0.101166;		hashvectf[519] =-0.707733;
    hashvectf[520] = -0.705963;		hashvectf[521] =0.026428;		hashvectf[522] =0.374908;		hashvectf[523] =0.68457;		  hashvectf[524] =0.625092;		hashvectf[525] =0.472137;		hashvectf[526] =0.208405;		hashvectf[527] =-0.856506;
    hashvectf[528] = -0.703064;		hashvectf[529] =-0.581085;		hashvectf[530] =-0.409821;		hashvectf[531] =-0.417206;		hashvectf[532] =-0.736328;		hashvectf[533] =0.532623;		hashvectf[534] =-0.447876;		hashvectf[535] =-0.20285;
    hashvectf[536] = -0.870728;		hashvectf[537] =0.086945;		hashvectf[538] =-0.990417;		hashvectf[539] =0.107086;		hashvectf[540] =0.183685;		hashvectf[541] =0.018341;		hashvectf[542] =-0.982788;		hashvectf[543] =0.560638;
    hashvectf[544] = -0.428864;		hashvectf[545] =0.708282;		hashvectf[546] =0.296722;		hashvectf[547] =-0.952576;		hashvectf[548] =-0.0672;		  hashvectf[549] =0.135773;		hashvectf[550] =0.990265;		hashvectf[551] =0.030243;
    hashvectf[552] = -0.068787;		hashvectf[553] =0.654724;		hashvectf[554] =0.752686;		hashvectf[555] =0.762604;		hashvectf[556] =-0.551758;		hashvectf[557] =0.337585;		hashvectf[558] =-0.819611;		hashvectf[559] =-0.407684;
    hashvectf[560] = 0.402466;		  hashvectf[561] =-0.727844;		hashvectf[562] =-0.55072;		hashvectf[563] =-0.408539;		hashvectf[564] =-0.855774;		hashvectf[565] =-0.480011;		hashvectf[566] =0.19281;		  hashvectf[567] =0.693176;
    hashvectf[568] = -0.079285;		hashvectf[569] =0.716339;		hashvectf[570] =0.226013;		hashvectf[571] =0.650116;		hashvectf[572] =-0.725433;		hashvectf[573] =0.246704;		hashvectf[574] =0.953369;		hashvectf[575] =-0.173553;
    hashvectf[576] = -0.970398;		hashvectf[577] =-0.239227;		hashvectf[578] =-0.03244;		hashvectf[579] =0.136383;		hashvectf[580] =-0.394318;		hashvectf[581] =0.908752;		hashvectf[582] =0.813232;		hashvectf[583] =0.558167;
    hashvectf[584] = 0.164368;		  hashvectf[585] =0.40451;		  hashvectf[586] =0.549042;		hashvectf[587] =-0.731323;		hashvectf[588] =-0.380249;		hashvectf[589] =-0.566711;		hashvectf[590] =0.730865;		hashvectf[591] =0.022156;
    hashvectf[592] = 0.932739;		  hashvectf[593] =0.359741;		hashvectf[594] =0.00824;		  hashvectf[595] =0.996552;		hashvectf[596] =-0.082306;		hashvectf[597] =0.956635;		hashvectf[598] =-0.065338;		hashvectf[599] =-0.283722;
    hashvectf[600] = -0.743561;		hashvectf[601] =0.008209;		hashvectf[602] =0.668579;		hashvectf[603] =-0.859589;		hashvectf[604] =-0.509674;		hashvectf[605] =0.035767;		hashvectf[606] =-0.852234;		hashvectf[607] =0.363678;
    hashvectf[608] = -0.375977;		hashvectf[609] =-0.201965;		hashvectf[610] =-0.970795;		hashvectf[611] =-0.12915;		hashvectf[612] =0.313477;		hashvectf[613] =0.947327;		hashvectf[614] =0.06546;		  hashvectf[615] =-0.254028;
    hashvectf[616] = -0.528259;		hashvectf[617] =0.81015;		  hashvectf[618] =0.628052;		hashvectf[619] =0.601105;		hashvectf[620] =0.49411;		  hashvectf[621] =-0.494385;		hashvectf[622] =0.868378;		hashvectf[623] =0.037933;
    hashvectf[624] = 0.275635;		  hashvectf[625] =-0.086426;		hashvectf[626] =0.957336;		hashvectf[627] =-0.197937;		hashvectf[628] =0.468903;		hashvectf[629] =-0.860748;		hashvectf[630] =0.895599;		hashvectf[631] =0.399384;
    hashvectf[632] = 0.195801;		  hashvectf[633] =0.560791;		hashvectf[634] =0.825012;		hashvectf[635] =-0.069214;		hashvectf[636] =0.304199;		hashvectf[637] =-0.849487;		hashvectf[638] =0.43103;		  hashvectf[639] =0.096375;
    hashvectf[640] = 0.93576;		  hashvectf[641] =0.339111;		hashvectf[642] =-0.051422;		hashvectf[643] =0.408966;		hashvectf[644] =-0.911072;		hashvectf[645] =0.330444;		hashvectf[646] =0.942841;		hashvectf[647] =-0.042389;
    hashvectf[648] = -0.452362;		hashvectf[649] =-0.786407;		hashvectf[650] =0.420563;		hashvectf[651] =0.134308;		hashvectf[652] =-0.933472;		hashvectf[653] =-0.332489;		hashvectf[654] =0.80191;		  hashvectf[655] =-0.566711;
    hashvectf[656] = -0.188934;		hashvectf[657] =-0.987946;		hashvectf[658] =-0.105988;		hashvectf[659] =0.112518;		hashvectf[660] =-0.24408;		hashvectf[661] =0.892242;		hashvectf[662] =-0.379791;		hashvectf[663] =-0.920502;
    hashvectf[664] = 0.229095;		  hashvectf[665] =-0.316376;		hashvectf[666] =0.7789;		  hashvectf[667] =0.325958;		hashvectf[668] =0.535706;		hashvectf[669] =-0.912872;		hashvectf[670] =0.185211;		hashvectf[671] =-0.36377;
    hashvectf[672] = -0.184784;		hashvectf[673] =0.565369;		hashvectf[674] =-0.803833;		hashvectf[675] =-0.018463;		hashvectf[676] =0.119537;		hashvectf[677] =0.992615;		hashvectf[678] =-0.259247;		hashvectf[679] =-0.935608;
    hashvectf[680] = 0.239532;		  hashvectf[681] =-0.82373;		hashvectf[682] =-0.449127;		hashvectf[683] =-0.345947;		hashvectf[684] =-0.433105;		hashvectf[685] =0.659515;		hashvectf[686] =0.614349;		hashvectf[687] =-0.822754;
    hashvectf[688] = 0.378845;		  hashvectf[689] =-0.423676;		hashvectf[690] =0.687195;		hashvectf[691] =-0.674835;		hashvectf[692] =-0.26889;		hashvectf[693] =-0.246582;		hashvectf[694] =-0.800842;		hashvectf[695] =0.545715;
    hashvectf[696] = -0.729187;		hashvectf[697] =-0.207794;		hashvectf[698] =0.651978;		hashvectf[699] =0.653534;		hashvectf[700] =-0.610443;		hashvectf[701] =-0.447388;		hashvectf[702] =0.492584;		hashvectf[703] =-0.023346;
    hashvectf[704] = 0.869934;		  hashvectf[705] =0.609039;		hashvectf[706] =0.009094;		hashvectf[707] =-0.79306;		hashvectf[708] =0.962494;		hashvectf[709] =-0.271088;		hashvectf[710] =-0.00885;		hashvectf[711] =0.2659;
    hashvectf[712] = -0.004913;		hashvectf[713] =0.963959;		hashvectf[714] =0.651245;		hashvectf[715] =0.553619;		hashvectf[716] =-0.518951;		hashvectf[717] =0.280548;		hashvectf[718] =-0.84314;		hashvectf[719] =0.458618;
    hashvectf[720] = -0.175293;		hashvectf[721] =-0.983215;		hashvectf[722] =0.049805;		hashvectf[723] =0.035339;		hashvectf[724] =-0.979919;		hashvectf[725] =0.196045;		hashvectf[726] =-0.982941;		hashvectf[727] =0.164307;
    hashvectf[728] = -0.082245;		hashvectf[729] =0.233734;		hashvectf[730] =-0.97226;		hashvectf[731] =-0.005005;		hashvectf[732] =-0.747253;		hashvectf[733] =-0.611328;		hashvectf[734] =0.260437;		hashvectf[735] =0.645599;
    hashvectf[736] = 0.592773;		  hashvectf[737] =0.481384;		hashvectf[738] =0.117706;		hashvectf[739] =-0.949524;		hashvectf[740] =-0.29068;		hashvectf[741] =-0.535004;		hashvectf[742] =-0.791901;		hashvectf[743] =-0.294312;
    hashvectf[744] = -0.627167;		hashvectf[745] =-0.214447;		hashvectf[746] =0.748718;		hashvectf[747] =-0.047974;		hashvectf[748] =-0.813477;		hashvectf[749] =-0.57959;		hashvectf[750] =-0.175537;		hashvectf[751] =0.477264;
    hashvectf[752] = -0.860992;		hashvectf[753] =0.738556;		hashvectf[754] =-0.414246;		hashvectf[755] =-0.53183;		hashvectf[756] =0.562561;		hashvectf[757] =-0.704071;		hashvectf[758] =0.433289;		hashvectf[759] =-0.754944;
    hashvectf[760] = 0.64801;		  hashvectf[761] =-0.100586;		hashvectf[762] =0.114716;		hashvectf[763] =0.044525;		hashvectf[764] =-0.992371;		hashvectf[765] =0.966003;		hashvectf[766] =0.244873;		hashvectf[767] =-0.082764;
  
  }
};