/** Reject malformed/unbounded level data before constructing a run. */
export function validateLevel(level, validTileIds = new Set(Array.from({length:17},(_,i)=>i))) {
  const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  const dim=level?.dimensi;
  if (!dim || !integer(dim.lebar_tiles,1,4096) || !integer(dim.tinggi_tiles,1,256) || dim.tile_size!==16 || dim.lebar_tiles*dim.tinggi_tiles>262144) throw new Error("Dimensi level tidak valid");
  if (dim.lebar_px!==dim.lebar_tiles*16 || dim.tinggi_px!==dim.tinggi_tiles*16) throw new Error("Dimensi pixel level tidak konsisten");
  if(!Array.isArray(level.layer_tile) || level.layer_tile.length>8)throw new Error("Layer level tidak valid");
  const ids=new Set();
  for(const layer of level.layer_tile){
    if(ids.has(layer.id))throw new Error("ID layer duplikat");ids.add(layer.id);
    if(!Array.isArray(layer.data)||layer.data.length!==dim.lebar_tiles*dim.tinggi_tiles||!layer.data.every(n=>validTileIds.has(n)))throw new Error("Data tile tidak valid");
  }
  if(!ids.has("layer_main"))throw new Error("Layer utama tidak ada");
  const point=p=>p&&integer(p.tile_x,0,dim.lebar_tiles-1)&&integer(p.tile_y,0,dim.tinggi_tiles-1);
  if(!point(level.spawn?.player)||!Array.isArray(level.spawn?.checkpoint)||level.spawn.checkpoint.length>64||!level.spawn.checkpoint.every(point))throw new Error("Spawn/checkpoint tidak valid");
  const types=new Set(["enemy_soldier","enemy_monkey","item_chest","item_gobog","item_maja_fruit","level_exit","prop_banner","prop_candi_kanan","prop_candi_kiri","prop_palmtree_med","prop_palmtree_short","prop_palmtree_tall","prop_relief","prop_torch","trigger_spike"]);
  if(!Array.isArray(level.objek)||level.objek.length>2048)throw new Error("Objek level tidak valid");
  const objectIds=new Set();
  for(const object of [...level.spawn.checkpoint,...level.objek]){
    if(typeof object.id!=="string"||!object.id||objectIds.has(object.id)||!point(object))throw new Error("ID/posisi objek tidak valid");objectIds.add(object.id);
    if(level.objek.includes(object) && !types.has(object.tipe))throw new Error("Tipe objek tidak dikenal");
    for(const key of ["hp","damage","nilai","interval_aktif_ms","durasi_aktif_ms","lebar_tiles"])if(object[key]!==undefined&&(!Number.isFinite(object[key])||object[key]<0||object[key]>600000))throw new Error(`Nilai ${key} tidak valid`);
    for(const key of ["interval_aktif_ms","durasi_aktif_ms","lebar_tiles"])if(object[key]!==undefined&&object[key]===0)throw new Error(`Nilai ${key} harus positif`);
    if(object.lebar_tiles!==undefined&&(!Number.isInteger(object.lebar_tiles)||object.tile_x+object.lebar_tiles>dim.lebar_tiles))throw new Error("Area trigger di luar level");
  }
  if(!level.objek.some(o=>o.tipe==="level_exit"))throw new Error("Exit level tidak ada");
  return level;
}
