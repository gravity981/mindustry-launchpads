/** @param {SectorInfo} info */
const hasExports = (info) => {
  return info.anyExports();
};

/**
 * @param {Sector|null} sector
 * @returns {string}
 */
const getSectorName = (sector) => {
  if (sector === null) {
    return "None";
  }
  let icon = "";
  if (sector.info.contentIcon) {
    icon = sector.info.contentIcon.emoji() + " ";
  }
  else if (sector.info.icon !== null) {
    icon = String.fromCharCode(Iconc.codes.get(sector.info.icon)) + " ";
  }
  return icon + sector.name();
};

const getSectors = () => {
  const sectors = /** @type {Sector[]}*/ (
    Planets.serpulo.sectors.toArray()
  ).filter((sector) => hasExports(sector.info));

  const sectorInfo = sectors.map((sector) => ({
    source: [sector],
    route:
      getSectorName(sector) +
      "\n\n" +
      String.fromCharCode(Iconc.codes.get("rightOpen")) +
      " " +
      getSectorName(sector.info.destination),
  }));

  if (sectors.length >= 2) {
    sectorInfo.unshift({ source: sectors, route: "Redirect All" });
  }
  return sectorInfo;
};

/**
 * @param {() => void} callback
 */
const addSelectionButton = (callback) => {
  Vars.ui.planet.shown(() => {
    if (Vars.ui.planet.mode === PlanetDialog.Mode.look) {
      const sectors = getSectors();
      if (sectors.length > 0) {
        Vars.ui.planet.fill(
          cons((t) => {
            t.top().left().marginTop(120).marginLeft(5).defaults().size(200, 54);
            t.button(
              "Launchpads",
              new TextureRegionDrawable(
                Blocks.launchPad.uiIcon
              ),
              Vars.iconSmall,
              callback
            ).pad(2);
          })
        );
      }
    }
  });
};

/**
 * @param {Sector[]} sectors
 * @returns {Sector}
 */
const getSourceSector = (sectors) => {
  let sector;
  try {
    sector = Vars.ui.planet.state.planet.getLastSector();
  } catch (e) {
    sector = null;
  }
  return sector === null ? sectors[0] : sector;
};

const getDestinationDialog = (() => {
  let dialog;
  return () => {
    if (!dialog) {
      dialog = extend(PlanetDialog, {
        playSelected() {
          this.listener.get(this.selected);
          this.hide();
        },
      });
    }
    return dialog;
  };
})();

/**
 * @param {(sources: Sector[], destination: Sector ) => void } callback
 */
const showSelectionDialog = (callback) => {
  const exportInfo = getSectors();
  const dialog = new BaseDialog("Launchpads");
  dialog.addCloseButton();

  dialog.cont
    .defaults()
    .width(Vars.mobile ? 500 : 560)
    .pad(4);
  dialog.cont.pane((t) =>
    exportInfo.forEach((sector) => {
      t.button(sector.route, () => {
        getDestinationDialog().showSelect(
          getSourceSector(sector.source),
          (/** @type {Sector} */ d) => callback(sector.source, d)
        );
        dialog.hide();
      })
        .growX()
        .pad(8)
        .wrap();
      t.row();
    })
  );
  dialog.show();
};

Events.on(ClientLoadEvent, () => {
  addSelectionButton(() =>
    showSelectionDialog((sources, destination) => {
      sources.forEach((sector) =>
        Core.app.post(() => {
          sector.info.destination =
            sector.id !== destination.id ? destination : null;
          sector.saveInfo();
        })
      );
      Vars.ui.planet.lookAt(destination, 1);
    })
  );
});
