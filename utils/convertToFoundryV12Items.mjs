// convertToFoundryV12Items.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === IHR ÜBERSETZUNGSOBJECKT (aus Ihrer Anfrage kopiert) ===
const TRANSLATIONS = {
    COMMON_ITEM: {
      "ABAKUS": "Abakus",
      "ABBLENDLATERNE": "Abblendlaterne",
      "ALCHIMISTENLABOR": "Alchimistenlabor",
      "AMBOSS_GROSS": "Amboss (groß)",
      "AMBOSS_KLEIN": "Amboss (klein)",
      "AMBOSS_REISEAMBOSS": "Amboss (Reiseamboss)",
      "AMULETT_BRONZE": "Amulett (Bronze)",
      "AMULETT_GOLD": "Amulett (Gold)",
      "AMULETT_SILBER": "Amulett (Silber)",
      "ANGEL_10_SCHRITT_ANGELSCHNUR": "Angel (10 Schritt Angelschnur)",
      "ANGSTGIFT": "Angsgift",
      "ANTIDOT": "Antidot",
      "ARAX": "Arax",
      "ARCHAISCHES_LABOR": "Archaisches Labor",
      "ARMILLARSPHAERE": "Armillarsphäre",
      "ARMREIF_BRONZE": "Armreif (Bronze)",
      "ARMREIF_DER_WILLENSSTAERKE": "Armreif der Willensstärke",
      "ARMREIF_GOLD": "Armreif (Gold)",
      "ARMREIF_SILBER": "Armreif (Silber)",
      "ASTROLABIUM": "Astrolabium",
      "BADEOEL": "Badeöl",
      "BANNPULVER_GEGE_UNSICHTBARES": "Bannpulver gegen Unsichtbares",
      "BANNSTAUB": "Bannstaub",
      "BECHER": "Becher",
      "BEIL": "Beil",
      "BERNSTEINBRILLE": "Bernsteinbrille",
      "BERSERKERELEXIER": "Berserkerelexier",
      "BESEN": "Besen",
      "BIER_KLEINES_FAESSCHEN": "Bier (kleines Fässchen)",
      "BLUTEGEL": "Blutegel",
      "BOLTANKARTENSET_PAPIER": "Boltankartenset, Papier",
      "BOLTANKARTENSET_PAPIER_GEZINKT": "Boltankartenset, Papier (gezinkt)",
      "BOLTANKARTENSET_STOFF": "Boltankartenset, Stoff",
      "BOLTANKARTENSET_STOFF_GEZINKT": "Boltankartenset, Stoff (gezinkt)",
      "BOLZEN": "Bolzen",
      "BRANDSALBE": "Brandsalbe",
      "BRATSPIESS_EISEN": "Bratspieß (Eisen)",
      "BRECHEISEN": "Brecheisen",
      "BRECHSTANGE": "Brechstange",
      "BRENNGLAS": "Brennglas",
      "BRETTSPIEL": "Brettspiel",
      "BROTBEUTEL_GROSS": "Brotbeutel (groß)",
      "BROTBEUTEL_KLEIN": "Brotbeutel (klein)",
      "BUCH_ANNALEN_DES_GOETTERALTERS": "Buch (Annalen des Götteralters)",
      "BUCH_BREVIER_DER_ZWOELFGOETTLICHEN_UNTERWEISUNG": "Buch (Brevier der zwölfgöttlichen Unterweisung)",
      "BUCH_CODEX_ALBYRICUS": "Buch (Codex Albyricus)",
      "BUCH_ENCYCLOPAEDIA_MAGICA_1_BAND": "Buch (Encyclopaedia Magica, 1 Band)",
      "BUCH_GROSSER_AVENTURISCHER_ATLAS": "Buch (Großer Aventurischer Atlas)",
      "BUCH_HERBARIUM_KUSLIKUM": "Buch (Herbarium Kuslikum)",
      "BUCH_HILFFREYCHER_LEYTFADEN_DES_WANDERNDEN_ADEPTEN": "Buch (Hilffreycher Leytfaden des wandernden Adepten)",
      "BUCH_PREMS_TIERLEBEN": "Buch (Prems Tierleben)",
      "BUCH_VADEMECUM_FUER_DAS_WAFFENHANDWERK": "Buch (Vademecum für das Waffenhandwerk)",
      "BUCH_WIE_MAN_KAEMPFT_REITET_UND_BIER_TRINKT": "Buch (Wie man kämpft, reitet und Bier trinkt)",
      "BUERSTE": "Bürste",
      "CHIRURGISCHE_INSTRUMENTE": "Chirurgische Instrumente",
      "CHIRURGISCHE_INSTRUMENTE_HOCHWERTIGES_INSTRUMENTARIUM": "Chirurgische Instrumente (Hochwertiges Instrumentarium)",
      "DIETRICHE": "Dietriche",
      "DIETRICHSET_6_STUECK": "Dietrichset (6 unterschiedliche Dietriche)",
      "DREHLEIER": "Drehleier",
      "DREIZACK": "Dreizack",
      "DRESCHFLEGEL": "Dreschflegel",
      "EDELSTEIN_AMETHIST": "Edelstein (Amethist)",
      "EDELSTEIN_AQUAMARIN": "Edelstein (Aquamarin)",
      "EDELSTEIN_AVENTURIN": "Edelstein (Aventurin)",
      "EDELSTEIN_BERGKRISTALL": "Edelstein (Bergkristall)",
      "EDELSTEIN_BERNSTEIN": "Edelstein (Bernstein)",
      "EDELSTEIN_DIAMANT": "Edelstein (Diamant)",
      "EDELSTEIN_GRANAT": "Edelstein (Granat)",
      "EDELSTEIN_GRUENE_JADE": "Edelstein (Grüne Jade)",
      "EDELSTEIN_KARNEOL": "Edelstein (Karneol)",
      "EDELSTEIN_LAPISLAZULI": "Edelstein (Lapislazuli)",
      "EDELSTEIN_MONDSTEIN": "Edelstein (Mondstein)",
      "EDELSTEIN_ONYX": "Edelstein (Onyx)",
      "EDELSTEIN_OPAL": "Edelstein (Opal)",
      "EDELSTEIN_PERLE": "Edelstein (Perle)",
      "EDELSTEIN_RUBIN": "Edelstein (Rubin)",
      "EDELSTEIN_SAPHIR": "Edelstein (Saphir)",
      "EDELSTEIN_SMARAGD": "Edelstein (Smaragd)",
      "EDELSTEIN_TOPAS": "Edelstein (Topas)",
      "EDELSTEIN_TUERKIS": "Edelstein (Türkis)",
      "EGELSCHRECKPASTE": "Egelschreckpaste",
      "EINBEERENTRANK": "Einbeerentrank",
      "ELIXIERE_DER_TUGEND": "Elexiere der Tugend",
      "ERSCHOEPFUNGSPILLEN": "Erschöpfungspillen",
      "ESSBESTECK": "Essbesteck",
      "EULENTRAENEN": "Eulentränen",
      "FACKEL": "Fackel",
      "FALSCHER_BART": "falscher Bart",
      "FANFARE": "Fanfare",
      "FEDERKIEL_GANS": "Federkiel (Gans)",
      "FEDERKIEL_PELIKAN": "Federkiel (Pelikan)",
      "FEDERKIEL_SCHWAN": "Federkiel (Schwan)",
      "FEDERKIEL_STORCH": "Federkiel (Storch)",
      "FEDERMESSER": "Federmesser",
      "FEILE": "Feile",
      "FEINWERKMECHANIKER_WERKZEUG": "Feinmechaniker-Werkzeug",
      "FELDFLASCHE": "Feldflasche",
      "FERNROHR": "Fernrohr",
      "FERNROHR_GROSS": "Fernrohr (groß)",
      "FERNROHR_KLEIN": "Fernrohr (klein)",
      "FERNROHR_ZUSAMMENSCHIEBBAR": "Fernrohr (zusammenschiebbar)",
      "FESSELSEIL_HANF_10_SCHRITT": "Fesselseil, Hanf (pro 1 Schritt)",
      "FESSELSEIL_LEDER_10_SCHRITT": "Fesselseil, Leder (pro 1 Schritt)",
      "FEUERSTEIN_UND_STAHL": "Feuerstein und Stahl",
      "FIBEL_BRONZE": "Fibel (Bronze)",
      "FIBEL_GOLD": "Fibel (Gold)",
      "FIBEL_SILBER": "Fibel (Silber)",
      "FIRNKLINGE": "Firnklinge",
      "FLASCHENZUG_MAX_250_STEIN": "Flaschenzug (max. 250 Stein)",
      "FLEISCHERBEIL": "Fleischerbeil",
      "FLOETE": "Flöte",
      "FURCHTLOS_TROPFEN": "Furchtlos Tropfen",
      "GEHEIMTINTE": "Geheimtinte",
      "GELDBEUTEL": "Geldbeutel",
      "GELDKATZE": "Geldkatze",
      "GOETTERFIGUERCHEN": "Götterfigürchen",
      "GRAVURWERKZEUG": "Gravurwerkzeug",
      "GUERTELTASCHE": "Gürteltasche",
      "GULMONDTEE": "Gulmondtee",
      "GWEN_PETRYL_STEIN_FAUSTGROSS": "Gwen-Petryl-Stein (faustgroß)",
      "GWEN_PETRYL_STEIN_FINGERKUPPENGROSS": "Gwen-Petryl-Stein (fingerkuppengroß)",
      "GWEN_PETRYL_STEIN_KOPFGROSS": "Gwen-Petryl-Stein (kopfgroß)",
      "HAENGEMATTE": "Hängematte",
      "HALSKETTE_BRONZE": "Halskette (Bronze)",
      "HALSKETTE_GOLD": "Halskette (Gold)",
      "HALSKETTE_SILBER": "Halskette (Silber)",
      "HAMMER": "Hammer",
      "HANDAXT": "Handaxt",
      "HANDBOHRER": "Handbohrer",
      "HANDHARFE": "Handharfe",
      "HANDSAEGE": "Handsäge",
      "HANDSPIEGEL": "Handspiegel",
      "HAUMESSER": "Haumesser",
      "HEILTRANK": "Heiltrank",
      "HEXENKUECHE": "Hexenküche",
      "HOLZFAELLERAXT": "Holzfälleraxt",
      "HOLZSCHALE": "Holzschale",
      "HOLZTELLER": "Holzteller",
      "HYLAILER_FEUER": "Hylailer Feuer",
      "JONGLIERBALL": "Jonglierball",
      "JONGLIERBALL_MIT_GEWICHTEN": "Jonglierball (mit Gewichten)",
      "KABASFLOETE": "Kabasflöte",
      "KAFFEE_GEROESTET": "Kaffee, geröstet",
      "KAKAO": "Kakao",
      "KALTES_LICHT": "Kaltes Licht",
      "KAMELSPIEL": "Kamelspiel",
      "KAMELSPIEL_GEZINKT": "Kamelspiel (gezinkt)",
      "KAMM": "Kamm",
      "KARTOGRAPHIEWERKZEUG": "Kartographiewerkzeug",
      "KERZE": "Kerze",
      "KERZENSTAENDER": "Kerzenständer",
      "KERZE_STUNDENKERZE": "Kerze (Stundenkerze)",
      "KERZE_ZAUBERKERZE": "Kerze (Zauberkerze)",
      "KETTE_10_SCHRITT": "Kette (pro 1 Schritt)",
      "KIEPE": "Kiepe",
      "KLETTERHAKEN": "Kletterhaken",
      "KLETTERSEIL_10_SCHRITT": "Kletterseil (pro 10 Schritt)",
      "KLETTERSEIL_SEIDE_10_SCHRITT": "Kletterseil, Seide (pro 10 Schritt)",
      "KOHLESTIFT": "Kohlestift",
      "KOMPASS_SUEDWEISER": "Kompass (Südweiser)",
      "KOMPASS_SUEDWEISER_METALLGEHAEUSE": "Kompass (Südweiser),Metallgehäuse",
      "KOPFTUCH": "Kopftuch",
      "KOPFTUCH_KEFFIYA": "Kopftuch (Keffiya)",
      "KOPFTUCH_PIRATENKOPFTUCH": "Kopftuch (Piratenkopftuch)",
      "KREIDE": "Kreide",
      "KREIDE_ZAUBERKREIDE": "Kreide (Zauberkreide)",
      "KRISTALLKUGEL": "Kristallkugel",
      "KRUG": "Krug",
      "KUGEL": "Kugel",
      "KUKRIS": "Kukris",
      "KUPFERKESSEL": "Kupferkessel",
      "LAMPENOEL_12_STUNDEN": "Lampenöl (12h)",
      "LATERNE": "Laterne",
      "LAUTE": "Laute",
      "LEDERRANZEN": "Lederranzen",
      "LEDERRUCKSACK": "Lederrucksack",
      "LEIM": "Leim",
      "LIEBESTRUNK": "Liebestrunk",
      "LIPPENROT": "Lippenrot",
      "MAGIERROBE_BESCHWOERUNGSGEWAND": "Magierrobe (Beschwörungsgewand)",
      "MAGIERROBE_GROSSES_GEWAND": "Magierrobe (Großes Gewand)",
      "MAGIERROBE_KONVENTSGEWAND": "Magierrobe (Konventsgewand)",
      "MAGIERROBE_LEICHTES_GEWAND": "Magierrobe (Leichtes Gewand)",
      "MAGIERROBE_NORMALE_ROBE": "Magierrobe (Normale Robe)",
      "MAGIERROBE_REISEGEWAND": "Magierrobe (Reisegewand)",
      "MANTEL": "Mantel",
      "MEISSEL": "Meißel",
      "MESSER": "Messer",
      "NADEL_UND_ZWIRNSET": "Nadel- und Zwirnset",
      "NAEGEL_10_STUECK": "Nägel (10 Stück)",
      "NAEHKAESTCHEN": "Nähkästchen",
      "NAGELFEILE": "Nagelfeile",
      "NUDELHOLZ": "Nudelholz",
      "OELLAMPE": "Öllampe",
      "OHRRING_BRONZE": "Ohrring (Bronze)",
      "OHRRING_GOLD": "Ohrring (Gold)",
      "OHRRING_SILBER": "Ohrring (Silber)",
      "OLGINSUD": "Olginsund",
      "PAPIER_1_BLATT": "Papier (1 Blatt)",
      "PAPIER_HOHE_QUALITAET_1_BLATT": "Papier, hohe Qualität (1 Blatt)",
      "PARFUEM": "Parfüm",
      "PERGAMENT_1_BLATT": "Pergament (1 Blatt)",
      "PERGAMENT_HOHE_QUALITAET_1_BLATT": "Pergament, hohe Qualität (1 Blatt)",
      "PFANNE": "Pfanne",
      "PFEFFER": "Pfeffer",
      "PFEIL": "Pfeil",
      "PHIOLE": "Phiole",
      "PINSEL": "Pinsel",
      "PROVIANT_1_TAG": "Proviant (1 Tag)",
      "PUDER": "Puder",
      "PUDERDOESCHEN": "Puderdöschen",
      "PURPUBLITZ": "Purpurblitz",
      "PURPUSWASSER": "Purpurwasser",
      "QUADRANT": "Quadrant",
      "RING_BRONZE": "Ring (Bronze)",
      "RING_GOLD": "Ring (Gold)",
      "RING_SILBER": "Ring (Silber)",
      "SACK": "Sack",
      "SACKPFEIFE": "Sackpfeife",
      "SAMTHAUCH": "Samthauch (1 Portion)",
      "SCHAEDELBOHRER": "Schädelbohrer",
      "SCHAUFEL": "Schaufel",
      "SCHELLE": "Schelle",
      "SCHERE": "Schere",
      "SCHERE_SCHNEIDERSCHERE": "Schere (Schneiderschere)",
      "SCHLAFGIFT": "Schlafgift",
      "SCHLAFSACK": "Schlafsack",
      "SCHMIEDEHAMMER": "Schmiedehammer",
      "SCHMUCKKAESTCHEN": "Schmuckkästchen",
      "SCHNAPS": "Schnaps",
      "SCHNEESCHUHE": "Schneeschuhe",
      "SCHNUR_10_SCHRITT": "Schnur (pro 10 Schritt)",
      "SCHOKOLADE": "Schokolade",
      "SCHROEPFGLAS": "Schröpfglas",
      "SCHWADENBEUTEL": "Schwadenbeutel",
      "SCHWAMM": "Schwamm",
      "SEIFE": "Seife",
      "SEIFE_PARFUEMIERT": "Seife (parfümiert)",
      "SENSE": "Sense",
      "SICHEL": "Sichel",
      "SIEGELWACHS": "Siegelwachs",
      "SIGNALHORN": "Signalhorn",
      "SPATEN": "Spaten",
      "SPIELKARTEN": "Spielkarten",
      "SPIELUHR": "Spieluhr",
      "SPINETT": "Spinett",
      "SPITZHACKE": "Spitzhacke",
      "STANDHARFE": "Standharfe",
      "STECKENPFERD": "Steckenpferd",
      "STIRNREIF_BRONZE": "Stirnreif (Bronze)",
      "STIRNREIF_GOLD": "Stirnreif (Gold)",
      "STIRNREIF_SILBER": "Stirnreif (Silber)",
      "STOFFPUPPE": "Stoffpuppe",
      "STORCHENMASKE": "Storchenmaske",
      "STORCHENMASKE_ZUBEHOER_GESUNDHEITSSTEIGERNDE_ESSENZEN_1_ANWENDUNG": "Storchenmaske-Zubehör Gesundheitssteigernde Essenzen (1 Anwendung)",
      "STRICKLEITER_10_SCHRITT": "Strickleiter (pro 1 Schritt)",
      "STUNDENGLAS": "Stundenglas",
      "TABAKDOSE": "Tabakdose",
      "TABAKPFEIFE": "Tabakpfeife",
      "TABAK_KNASTER": "Tabak (Knaster)",
      "TABAK_METHUMIS_TABAK": "Tabak (Methumis-Tabak)",
      "TABAK_MOHACCA": "Tabak (Mohacca)",
      "TABAK_NORBARDISCHER_TABAK": "Tabak (Norbardischer Tabak)",
      "TABAK_SINODA_KRAUT": "Tabak (Sinoda-Kraut)",
      "TABAK_STANDARD": "Tabak (Standard)",
      "TAETOWIERWERKZEUG": "Tätowierwerkzeug",
      "TAGEBUCH": "Tagebuch",
      "TASCHENTUCH": "Taschentuch",
      "TASCHENUHR_VINSALTER_EI": "Taschenuhr (Vinsalter Ei)",
      "TIEGEL": "Tiegel",
      "TINTENFAESSCHEN_EDEL": "Tintenfässchen (edel)",
      "TINTENFAESSCHEN_EINFACH": "Tintenfässchen (einfach)",
      "TINTE_CHORHOPER_TINTE": "Tinte (Chorhoper Tinte)",
      "TINTE_GALLUSTINTE": "Tinte (Gallustinte)",
      "TINTE_PURPURTINTE": "Tinte (Purpurtinte)",
      "TRAUMKRAUT": "Traumkraut (1 Portion)",
      "TRINKHORN": "Trinkhorn",
      "TROMMEL": "Trommel",
      "TRUHE": "Truhe",
      "TRUHE_REISETRUHE": "Truhe (Reisetruhe)",
      "TRUHE_SCHATZTRUHE": "Truhe (Schatztruhe)",
      "TRUHE_SEEKISTE": "Truhe (Seekiste)",
      "TUCHBEUTEL": "Tuchbeutel",
      "UMHAENGETASCHE": "Umhängetasche",
      "UNSICHTBARKEITSELEXIER": "Unsichtbarkeitselexier",
      "UNVERWUNDBARKEITSTRANK": "Unverwundbarkeitstrank",
      "VASE": "Vase",
      "VERBAND_10_STUECK": "Verband (1 Verband)",
      "VERWANDLUNGSELEXIER": "Verwandlungselexier",
      "VORHAENGESCHLOSS": "Vorhängeschloss",
      "VORSCHLAGHAMMER": "Vorschlaghammer",
      "WAFFENBALSAM": "Waffenbalsam",
      "WASSERPFEIFFE": "Wasserpfeife",
      "WASSERSCHLAUCH": "Wasserschlauch",
      "WEIN": "Wein",
      "WILLENSTRUNK": "Willenstrunk",
      "WOLFSFELL": "Wolfsfell",
      "WOLLDECKE": "Wolldecke",
      "WOLLDECKE_PHRAISCHAFWOLLDECKE": "Wolldecke (Phraischafwolldecke)",
      "WUERFEL_SECHSSEITIG": "Würfel (sechsseitig)",
      "WUERFEL_SECHSSEITIG_GEZINKT": "Würfel (sechsseitig, gezinkt)",
      "WUERFEL_ZWANZIGSEITIG": "Würfel (zwanzigseitig)",
      "WUERFEL_ZWANZIGSEITIG_GEZINKT": "Würfel (zwanzigseitig, gezinkt)",
      "WUNDNAEHZEUG": "Wundnähzeug",
      "WURFHAKEN": "Wurfhaken",
      "ZANGE": "Zange",
      "ZAUBERTRANK": "Zaubertrank",
      "ZELT_1_PERSON": "Zelt (1 Person)",
      "ZELT_2_PERSONEN": "Zelt (2 Personen)",
      "ZELT_4_PERSONEN": "Zelt (4 Personen)",
      "ZELT_GROSSZELT_12_PERSONEN": "Zelt (Großzelt, 12 Personen)",
      "ZIELWASSER": "Zielwasser",
      "ZIMMERMANNSKASTEN": "Zimmermannskasten",
      "ZUNDERDOSE_FUER_25_PORTIONEN": "Zunderdose (für 25 Portionen)",
      "ZUNDER_25_PORTIONEN": "Zunder (25 Portionen)"
    },
    COMMON_ITEM_DESCRIPTION: {
      "ABAKUS_DESCRIPTION": "Keine Beschreibung",
      "ABBLENDLATERNE_DESCRIPTION": "Keine Beschreibung",
      "ALCHIMISTENLABOR_DESCRIPTION": "Keine Beschreibung",
      "AMBOSS_GROSS_DESCRIPTION": "Keine Beschreibung",
      "AMBOSS_KLEIN_DESCRIPTION": "Keine Beschreibung",
      "AMBOSS_REISEAMBOSS_DESCRIPTION": "Keine Beschreibung",
      "AMULETT_BRONZE_DESCRIPTION": "Keine Beschreibung",
      "AMULETT_GOLD_DESCRIPTION": "Keine Beschreibung",
      "AMULETT_SILBER_DESCRIPTION": "Keine Beschreibung",
      "ANGEL_10_SCHRITT_ANGELSCHNUR_DESCRIPTION": "Keine Beschreibung",
      "ANGSTGIFT_DESCRIPTION": "Ein nicht-tödliches Waffengift (Stufe 20).",
      "ANTIDOT_DESCRIPTION": "Hebt Gifte bis Stufe 16 auf.",
      "ARAX_DESCRIPTION": "Ein nicht-tödliches Waffengift (Stufe 20). Eine Anwendung genügt für 1W6 Treffer.",
      "ARCHAISCHES_LABOR_DESCRIPTION": "Keine Beschreibung",
      "ARMILLARSPHAERE_DESCRIPTION": "Keine Beschreibung",
      "ARMREIF_BRONZE_DESCRIPTION": "Keine Beschreibung",
      "ARMREIF_DER_WILLENSSTAERKE_DESCRIPTION": "Keine Beschreibung",
      "ARMREIF_GOLD_DESCRIPTION": "Keine Beschreibung",
      "ARMREIF_SILBER_DESCRIPTION": "Keine Beschreibung",
      "ASTROLABIUM_DESCRIPTION": "Ein Astrolabium ist ein komplexes Instrument, mit dem Astrologen Kalenderdaten, die Uhrzeit, den Stand der Gestirne, Auf- und Untergang dieser sowie deren zukünftigen Lauf am Himmel berechnen können. \n\nErfunden haben soll es vor Jahrhunderten Niobara von Anchopal, die berühmteste Sternkundlerin Aventuriens. Verwendet wird es vor allem von Gelehrten, die sich der Sternkunde widmen, Zauberkundigen, die den idealen Sternenstand für Rituale bestimmen wollen, und von echten wie selbsternannten Zukunftsdeutern. Auch in der Seefahrt findet es hin und wieder Anwendung zur Bestimmung der eigenen Position. \n\nEin Astrolabium besteht aus mehreren gegeneinander drehbaren Scheiben und Zeigern. Diese werden zunächst auf das aktuelle oder zu berechnende Datum eingestellt, dann auf ein gut bestimmbares Gestirn wie Sonne, Mond oder den Nordstern. Anschließend lassen sich die entsprechenden Positionen der Wandelsterne, des Zwölfkreises und weiterer Sternbilder bestimmen. Dabei lässt sich erkennen, wie weit die Gestirne über dem Horizont stehen, ob sie auf- oder absteigen und wie sie sich in nä- herer Zukunft bewegen werden. Nebenbei kann man au- ßerdem die aktuelle Uhrzeit erkennen. \n\nNeben den flachen Astrolabien gibt es auch sphärenförmige, bei denen statt der Scheiben und Zeiger einzelne Sterne und Sternbilder auf kreisförmigen Bahnen um Dere und einander bewegt werden können. Diese Astrolabien werden auch als Armillarsphären bezeichnet. Sie sind für den Laien deutlich einfacher zu verwenden, da sie weniger komplexe Berechnungen zu Beginn benö- tigen und optisch sehr viel anschaulicher sind, decken aber nach Meinung einiger Astrologen nicht alle Möglichkeiten ab. Für Wahrsagerei aus den Sternen ist diese Version jedoch beliebter, schon weil sie gegenüber Ratsuchenden mehr Eindruck macht. \n\nSeit dem Sternenfall sind Astrolabien nicht mehr zuverlässig. Eine Bestimmung des aktuellen Sternenhimmels ist noch möglich, doch alles, was zukünftige Ereignisse am Himmel betrifft, entspricht häufig nicht den angezeigten Ergebnissen. Wenige Tage im Voraus ist die Anzeige häufig noch korrekt, aber nicht bis ins Detail verlässlich. \n\nUm entsprechende Berechnungen wieder zuverlässig aufnehmen zu können, wird bereits eifrig geforscht. Bis die Veränderungen des Himmels in den Astrolabien der Wissenschaft abgebildet werden können und daraus wieder sichere Forschungsergebnisse entstehen, wird jedoch noch einige Zeit ins Land gehen. Manche bezweifeln sogar, dass dies jemals wieder der Fall sein wird. Gestirnverläufe der Vergangenheit lassen sich jedoch immer noch korrekt abbilden. \n\nVerbreitet sind Astrolabien in ganz Aventurien, überall dort, wo Sternkunde betrieben wird, besonders jedoch in den Tulamidenlanden, im Horasreich, in Tempeln von Hesinde und Phex und bei Propheten.",
      "BADEOEL_DESCRIPTION": "Keine Beschreibung",
      "BANNPULVER_GEGE_UNSICHTBARES_DESCRIPTION": "Im Umkreis von 2 Schritt werden unsichtbare Wesen oder unsichtbar gemachte Humanoide sichtbar. Nach 4W6 Initiativephasen verschwinden sie wieder.",
      "BANNSTAUB_DESCRIPTION": "Ein nicht-tödliches Einnahmegift der Stufe 28. Das Opfer verliert im Laufe der nächsten Stunde 2W6 AsP und regeneriert in der nächsten Nacht keine Astralenergie.",
      "BECHER_DESCRIPTION": "Keine Beschreibung",
      "BEIL_DESCRIPTION": "Keine Beschreibung",
      "BERNSTEINBRILLE_DESCRIPTION": "Keine Beschreibung",
      "BERSERKERELEXIER_DESCRIPTION": "Der Trinkende verfällt in einen Kampfrausch. Er erhält die Vorteile Kalte Wut und Offensiver Kampfstil und nutzt in jeder Aktion volle Offensive. Sind keine Gegner mehr da, greift er auch Verbündete an.",
      "BESEN_DESCRIPTION": "Keine Beschreibung",
      "BIER_KLEINES_FAESSCHEN_DESCRIPTION": "Keine Beschreibung",
      "BLUTEGEL_DESCRIPTION": "Keine Beschreibung",
      "BOLTANKARTENSET_DESCRIPTION": "Kein anderes Kartenspiel ist aventurienweit so beliebt wie das Boltanspiel. Das Spiel, auch Fünfas genannt, nutzt die 72 Elementkarten des Inrah. Die Karten unterteilen sich dabei in die sechs Elemente Feuer, Wasser, Luft, Erz, Humus und Eis. Jedes Element hat einen Satz von sieben Zahlkarten von 1 bis 7 und fünf Bildkarten (Knappe, Ritter, Wahrsagerin, Magier und Fürst). \n\nBeim Boltan geht es ums Täuschen des Gegners und um phexgefälliges Setzen des richtigen Betrags. Es gewinnt derjenige mit dem besten Blatt. Im Laufe der Zeit haben sich zahlreiche regionale Varianten wie Verborgene Fünf oder Fünf aus Sieben etabliert, sodass die Regeln teilweise ganz unterschiedliche Formen annehmen. \n\nDie Karten eines Boltanspiels können verschiedene Qualitäten aufweisen. Als Material für die Karten werden oftmals mit Leim gehärteter Stoff und Holz verwendet. Im Horasreich ist es aber durchaus üblich, einen Kartensatz aus Papier anzufertigen. Die Bilder auf den Karten werden oft einfach und schlicht gehalten, sodass nur Symbole und Zahlen zu sehen sind. Teure Ausgaben hingegen sind liebevoll bemalt und sogar bunt. Gerade wohlhabende Patrizier und der Adel spielen gerne mit einem ansehnlichen Set und sind bereit, dafür auch große Künstler anzuwerben. Teurer sind auch gezinkte Karten, denen man kaum ansehen kann, wie sie markiert sind. Auf Falschspiel stehen harte Strafen, aber der Reiz des Gewinns ist so groß, dass es einige Schurken gibt, die es trotzdem probieren. \n\nNeben der Kartenvariante gibt es auch ein Würfelspiel, das aber nicht so populär ist wie die Kartenversion. Wo immer man sich in Aventurien aufhält, die Chancen stehen gut, dass man in den Kneipen und Tavernen auf jemanden trifft, der mit einem Boltan spielt.",
      "BOLZEN_DESCRIPTION": "Bolzen für Armbrüste",
      "BRANDSALBE_DESCRIPTION": "Heilt eine Wunde, die durch Feuer oder Verätzung entstanden ist.",
      "BRATSPIESS_EISEN_DESCRIPTION": "Dieses nützliche Werkzeug darf bei keiner Spezies und Kultur, die ihre Nahrung mit Hilfe des Feuers gart, in einer gut sortierten Küche fehlen. Es gibt Bratspieße in verschiedenen Längen, je nachdem, was genau nun auf ihnen gebraten werden soll. Auf den Zyklopeninseln werden maximal unterarmlange, dünne Spießchen bevorzugt, um marinierte Fleischstücke und Paprika in die berühmten Zyklopenspieße zu verwandeln. In Andergast dagegen verdient ein Bratspieß seinen Namen erst dann, wenn er stabil genug ist, mindestens ein Ferkel zu tragen und zu braten. \n\nDie einfachsten Exemplare sind nichts weiter als an einem Ende angespitzte Stangen, die gewöhnliche Variante hat außerdem noch zwei Ständer, auf die der Spieß während des Bratens abgelegt werden kann. Anspruchsvolle Köche dagegen verwenden einen Bratspieß mit Drehkurbel, um ihre Finger zu schützen, vor allem aber, um sicherzustellen, dass das Bratgut gleichmäßig braun wird. \n\nSchon so mancher Wirt oder Held hat in einer verzweifelten Situation zum Bratspieß als einzig verfügbarer Waffe gegriffen.",
      "BRECHEISEN_DESCRIPTION": "Nicht jeder ist darin bewandert, eine Tür mittels eines Dietrichs zu öffnen. Dann ist das Werkzeug der Wahl meistens ein Brecheisen. Unter Einbrechern ist es nicht sonderlich beliebt, denn es hinterlässt Kratzspuren an der damit geöffneten Tür. Dennoch beherrschen die meisten Schurken dieser Art den Umgang damit außerordentlich gut. \n\nDas Brecheisen trägt seinen Namen zurecht, ist es doch aus stabilem Eisen gefertigt. Aufgrund seiner Form wird es mitunter auch als Brechstange bezeichnet, insbesondere etwas längere Varianten. \n\nBrecheisen werden auch von Gardisten verwendet, um verschlossene Türen zu öffnen. Oder von Zöllnern, die in die Kisten unkooperativer Händler blicken wollen. Auch in Steinbrüchen finden sie als Hebelwerkzeuge Verwendung. Zu einem ähnlichen Zweck benutzen das Brecheisen auch Schatzsucher, wobei sie es vor allem zu ihrer Ausrüstung zählen, um alte Schatztruhen zu öffnen.",
      "BRENNGLAS_DESCRIPTION": "Keine Beschreibung",
      "BRETTSPIEL_DESCRIPTION": "Keine Beschreibung",
      "BROTBEUTEL_DESCRIPTION": "Keine Beschreibung",
      "BUCH_ANNALEN_DES_GOETTERALTERS_DESCRIPTION": "Keine Beschreibung",
      "BUCH_BREVIER_DER_ZWOELFGOETTLICHEN_UNTERWEISUNG_DESCRIPTION": "So oder ähnlich beginnt das Brevier der zwölfgöttlichen Unterweisung. Es ist ein Buch, das den zwölfgöttlichen Glauben in gut verständlicher Sprache für alle zugänglich zusammenfasst. \n\nEs gibt eine Vielzahl verschiedener Versionen des Breviers, die sich nicht nur in der Buchqualität und der Verwendung von Illustrationen unterscheiden, sondern auch inhaltlich deutliche Unterschiede aufweisen können. In jeder Fassung des Breviers wird die Schöpfung der Welt beschrieben, anschließend folgt ein Kapitel zu jedem der zwölf Götter und ihren halbgöttlichen Kinder. Alle weiteren Kapitel hängen von der Version des Breviers ab, viele Ausgaben beinhalten Gebete und Abschnitte über die wichtigsten Heiligen, aber auch Texte über gutes, götterfürchtiges Verhalten sind häufig. Im Mittelreich gibt es mehrere Varianten mit einem Vorwort eines Provinzherrschers oder Kaisers und ergänzt um unterweisende Abhandlungen über Untertanentreue. \n\nVerbreitet ist das Buch besonders dort, wo Geweihte viel Umgang mit dem einfachen Volk haben, besonders in den Kirchen von Ingerimm, Travia und Peraine, in einigen Regionen auch von Efferd. Die Geweihten von Praios, Hesinde und Boron schätzen es ebenfalls, besonders für Dorfgeweihte, reisende Prediger und ihre Novizen zum Lesenlernen. Wenig Verwendung findet es bei den Geweihten von Tsa, Firun und Phex, die sich ohnehin wenig für niedergeschriebene Regularien interessieren. In allen anderen Kirchen gibt es in der Verwendung große regionale Unterschiede. \n\nBesonders beliebt ist es bei Missionaren und reisenden Geweihten aller Kirchen, die immer wieder Nicht-Zwölfgöttergläubigen begegnen. Viele Akoluthen, aber auch fromme Bürger nennen oft ein Brevier ihr Eigen, um ihm Gebete, Lebensweisheiten und -regeln zu entnehmen. Ein Brevier der zwölfgöttlichen Unterweisung lässt sich im Mittel- und Horasreich in jeder Stadt kaufen, besonders in gedruckter Form ist es weit verbreitet. Wer jedoch eine bestimmte Version will, muss eventuell eine Suche auf sich nehmen. \n\nGerade nach der Zerstörung von Arivor und der Zeit des Sternenfalls machen sich die Zwölfgöttergläubigen große Sorgen um die Zukunft, sodass das Brevier wieder zum Verkaufsschlager geworden ist und reißenden Absatz findet. Immerhin wollen sich viele an die Gebote der Zwölfgötter halten, um nicht in die Fänge des Namenlosen zu geraten. Und das Brevier widmet sich in fast allen Ausgaben auch dem Namenlosen, seiner Gefangennahme und seiner möglichen Befreiung, wenn man sich nicht an die Gebote der alveranischen Götter hält.",
      "BUCH_CODEX_ALBYRICUS_DESCRIPTION": "Der Codex Albyricus ist das Gesetzeswerk der Gildenmagier, das ihre Rechte ebenso regelt wie ihre Pflichten. Im Codex, wie das Buch in Magierkreisen meistens nur genannt wird, ist niedergelegt, welche Anforderungen eine Akademie zu erfüllen hat, wie die einzelnen Gilden miteinander umzugehen haben und auch, wie der Allaventurische Konvent, das große Treffen von Magiern aller Akademien, abläuft. \n\nDer Codex bestimmt Pflichten wie angemessene Bekleidung und das Verbot vieler Waffen und Rüstungen sowie die Unterwerfung unter den Codex und die Gildengerichtsbarkeit bei magischen Verbrechen aller Art. Für diese sind auch Strafen festgelegt, die von einem Ausschluss von höheren Ämtern, der sogenannten Disvocatio, bis hin zum Tod oder dem Verlust der Zauberkräfte variieren, abhängig von der Schwere des Vergehens. Dafür wird auch explizit festgelegt, was verboten ist, wie die Magie mit dem Blut beseelter Lebewesen, die Nekromantie und der Besitz einiger finsterer Schriften. Zusätzlich legt der Codex fest, wer sich eigentlich Magier nennen darf:\n »Nach der examinatio steht den prüfenden Magistrae Zeit zur Beratung zu, ob der candidatus allen Anforderungen gerecht wurde und würdig ist, fürderhin Siegel und Zeichen seiner Schule zu tragen und die ehrbaren Hallen seiner Academia zu verlassen.« \n\nPrüfungsregularien sind ebenso im Codex niedergelegt wie die Körperstelle, an der das Gildensiegel zu tragen sei. Letzteres wird trotzdem häufig ignoriert: \n»Appliziert wird das Sigillum in die Fläche der rechten Hand, auf dass ein jeder einen rechtschaffenen Magus oder eine Maga daran zu erkennen vermag.« \n\nDas Werk wurde von Rohal dem Weisen initiiert und umfasst mittlerweile sieben Bände. Auch in der Magierschaft ist es nicht unumstritten und wird immer wieder als altbacken kritisiert, besonders die Kleidungsvorschriften. Andere Magier dagegen kümmern sich nur um den Inhalt des Codexes, wenn er ihnen nützlich ist, böse Zungen behaupten, dass es sich dabei vorwiegend um Mitglieder der Schwarzen Gilde handelt.\n\n Tatsächlich ist der Codex, trotz seines Anspruchs aventurienweiter Wirksamkeit, nicht überall gültig. Im Mittel- und Horasreich kann sich ein reisender Magier meist darauf verlassen, in Nostria, Andergast und dem Bornland schon seltener. In Thorwal wird er eher ausgelacht, wenn er sich auf ein Buch bezieht, und in den Tulamidenlanden und Südaventurien ist Geld ohnehin oft wirksamer als geschriebenes Gesetz.\n\n Doch selbst wenn der Codex gilt, heißt das nicht, dass eine Stadtwache seinen Inhalt kennt oder überhaupt schon davon gehört hat. Dazu kommen oft noch regionale Gesetze und Regeln, die die Rechtsprechung für Magier hin und wieder außerordentlich kompliziert gestalten.",
      "BUCH_ENCYCLOPAEDIA_MAGICA_1_BAND_DESCRIPTION": "Diesen und ähnliche Texte findet der neugierige Leser in der Encyclopaedia Magica, dem Standardnachschlagewerk für Gildenmagier. \n\nDie Encyclopaedia, wie das Werk in Magierkreisen meistens genannt wird, enthält ausführliche Texte über die Historie der Magie, ein Verzeichnis der Magierakademien, bekannter Orden, Forschungszirkel und magischer Koryphäen in Gegenwart und Vergangenheit, sowie einige theoretische Abhandlungen und Darstellungen neuer Forschungsergebnisse. Dazu kommt ein Kompendium der bekannten Zauberformeln, ohne dass sich ein einziger Spruch daraus lernen ließe.\n\n Viele Magier nennen mindestens eine Sammlung mit Auszügen, die für die eigenen Interessen besonders nützlich sind, ihr Eigen. Besonders reisende Zauberer wollen sich ungern mit sieben schweren, zweihundertseitigen Folianten belasten. \n\nDoch in keiner Magierakademie darf die Encyclopaedia fehlen, wenn auch nicht jede Lehreinrichtung die aktuellste Auflage besitzt. Das Werk wird immer wieder überarbeitet und neu aufgelegt, unbestätigten Gerüchten zufolge sogar seit 2.000 Jahren, die ältesten erhaltenen Exemplare sind etwa 800 Jahre alt. Die aktuelle Version stammt von der Akademie in Punin.",
      "BUCH_GROSSER_AVENTURISCHER_ATLAS_DESCRIPTION": "Keine Beschreibung",
      "BUCH_HERBARIUM_KUSLIKUM_DESCRIPTION": "Das Herbarium Kuslikum ist eine umfangreiche Abhandlung über die aventurische Flora in neun Bänden von je 200 Seiten, die der Kusliker Hesindetempel 1005 BF herausgegeben hat. Die Bände sind erstaunlich unterhaltsam zu lesen, enthalten viele Quellenhinweise und jede Menge Skizzen und Zeichnungen. Die Lektüre ist ein Muss für jeden, der sich in Buchform mit der Pflanzenkunde beschäftigen will. Insgesamt kursieren etwa 700 Kopien unterschiedlicher Qualität. Die Manuskriptsammlung wird in den Hallen der Weisheit zu Kuslik verwahrt und von den Geweihten immer weiter ergänzt.",
      "BUCH_HILFFREYCHER_LEYTFADEN_DES_WANDERNDEN_ADEPTEN_DESCRIPTION": "Während seiner Ausbildung lernt ein jeder Jungmagus so manchen Trick fürs Leben, allerdings stumpft der Umgang gegenüber der Welt außerhalb der Akademie oder des Magierturms seines Lehrmeisters stark ab. Damit sich ein Magier nach einem Abschluss nicht verrennt, führt er bei seinem ersten Gang in die Außenwelt gerne diese Fibel bei sich. \n\nDer Hilffreyche Leytfaden des wandernden Adepten, um 715 BF in Khunchom zusammengestellt, listet zwar keine Zauberformeln auf, schließlich sollte der Magus sich diese während seiner Lehrzeit bereits angeeignet haben, dafür aber eine Vielzahl an Anleitungen zur korrekten Intonation und Atmung während der Vorbereitung auf einen Zauberspruch. Auch weist das Buch den Schüler daraufhin, welchen Zauber er in welcher Situation am ehesten gebrauchen soll, sollte dieser sich einmal nicht mehr sicher sein.",
      "BUCH_PREMS_TIERLEBEN_DESCRIPTION": "Prems Tierleben ist eine umfassende Sammlung über die Tierwelt der West- und Nordküste, des Orklandes, Albernias, des Lieblichen Feldes und der Zyklopeninseln. Um 923 BF wurde der Band herausgegeben. Die Texte wurden jedoch größtenteils weitaus früher verfasst, vermutlich durch unterschiedliche thorwalsche Autoren, und sind mit Zeichnungen versehen. Die etwa 200 direkten Abschriften sind meist kommentiert, das Original wird in Prem aufbewahrt. Abschriften der kommentierten Fassungen sind zwar meist umfangreicher, dafür aber oft ungenauer bei den einzelnen Beschreibungen.",
      "BUCH_VADEMECUM_FUER_DAS_WAFFENHANDWERK_DESCRIPTION": "985 BF von der inzwischen verstorbenen Garether Schwertmeisterin Krona Adersin als erstes explizites Fechtbuch verfasst, gilt das Adersin-Vademecum als wichtiger Schritt für die Begründung des Schwertgesellentums. Es beschreibt anschaulich unterschiedliche Kampfweisen mit Anderthalbhänder, Schwert, Schild und Linkhand und vergleicht ihre Wirksamkeit. Das Buch stieß auf den Widerstand der Kriegerakademien und Rondratempel, verbreitete sich aber schnell. Etwa 200 Abschriften sind derzeit im Umlauf. Die Arbeiten an einer gedruckten Neuauflage, die von Kronas Söhnen um weitere Techniken mit dem Anderthalbhänder ergänzt wurde, wurden auch nach Jost Andersins Tod fortgeführt. Bisher ließ sich Schwertmeister Erlan Adersin jedoch noch keine Aussage zum Erscheinen der Überarbeitung entlocken.",
      "BUCH_WIE_MAN_KAEMPFT_REITET_UND_BIER_TRINKT_DESCRIPTION": "Hinter diesem eigenwilligen Titel verbirgt sich ein Büchlein, das Ratschläge dazu gibt, wie man sich auf einem Pferd hält und dabei gut aussieht, möglichst viel Alkohol trinkt, ohne sich davon übergeben zu müssen oder zu betrunken zu sein, und wie man eine Schlägerei provoziert und gewinnt, auch gegen die Stadtgarde. Dabei strotzt es nur so vor Grammatik- und Zeichensetzungsfehlern und scheint auch keinerlei Struktur zu folgen, sondern einfach alle Empfehlungen aufzuführen, wie sie beim Schreiben in den Sinn kamen. \n\nAlle Ratschläge, die das Buch zu den angeführten Themen gibt, sind auf den ersten Blick in dieses Sammelsurium von eher zweifelhafter Qualität, stellen sich jedoch nach der Lektüre als erstaunlich lebensnah heraus. Ein erfahrener Säufer oder eine geübte Straßenkämpferin können aus diesem Buch eventuell nichts mehr lernen, doch für abenteuerlustige Kinder aus gutem Hause enthält es viele gute Ratschläge. Da es aufgrund seiner launigen Schreibweise auf diese verführerisch wirken kann, die Ratschläge in die Tat umzusetzen, sehen es manche besorgten Eltern und Hüter von Ordnung und guten Sitten als gefährliche Lektüre an und würden es nur zu gern verboten sehen. Allerdings konnte sich dies außerhalb einzelner Familien bisher nicht durchsetzen, auch ist das Buch vorwiegend in größeren Städten des Mittelreichs verbreitet.\n\nWer Wie man kämpft, reitet und Bier trinkt verfasst hat, ist unbekannt, allerdings wurde das Buch erstmals im Jahr 1007 in Havena gesichtet. Mittlerweile existieren zahlreiche Abschriften, die oft um nützliche Kommentare und Anmerkungen erweitert werden. Einige versuchen sogar, den Inhalt zu  strukturieren und in inhaltliche Kapitel (kämpfen, reiten, Bier trinken) einzuteilen. Dadurch sind die Unterschiede zwischen den einzelnen Versionen sehr groß, auch im Umfang. Die Erstabschriften haben noch 60 Seiten Umfang, doch einige aktuelle Versionen haben sich im Umfang mehr als verdoppelt. Neben Vertiefungen einzelner Themen enthalten manche Versionen auch Hinweise auf gute oder schlechte Tavernen einzelner Orte und können wie eine Reise durch die Kneipen einzelner Regionen wirken.",
      "BUERSTE_DESCRIPTION": "Keine Beschreibung",
      "CHIRURGISCHE_INSTRUMENTE_DESCRIPTION": "Keine Beschreibung",
      "DIETRICHE_DESCRIPTION": "Der Dietrich ist das Standardwerkzeug, wenn gerade nicht der richtige Schlüssel zur Hand ist. Zumeist in den Gürteltaschen von Fassadenkletterern, Beutelschneidern und anderen Schurken daheim, öffnen diese gebogenen Metallstäbchen fast jede Tür. Sie lassen sich aus nahezu jedem festeren Metall herstellen und je nach Art des Schlosses eignen sich unterschiedliche Varianten. Aufgrund ihrer geringen Größe lassen sich Dietriche gut verstecken. Ob bei einer überraschenden Untersuchung durch Stadtgardisten, oder um den belastenden Beweis für einen Einbruch verschwinden zu lassen – Dietriche passen fast überall hinein. Allerdings, und das macht das Handwerk eines guten Einbrechers aus, reicht es nicht, mit dieser simplen Erfindung in einem Schlüsselloch herumzustochern, denn die Beschaffenheit manchen Schlosses ist recht komplex, und nicht jeder Dietrich eignet sich für jede zu öffnende Tür. Daher führen geübte Türöffner meist ein ganzes Set dieser Metallstäbe unterschiedlicher Dicke, Form und Größe mit sich.\n\n Es lohnt sich daher, vor dem geplanten Einbruch das betreffende Schloss genauer zu untersuchen, damit nicht ein zu großes Arsenal an Werkzeug herumgetragen werden muss. Zum Öffnen muss der Dietrich vorsichtig ins Schloss geführt oder gestoßen werden. \n\nBei einem gewöhnlichen Bartschloss ersetzt der Dietrich die Rillen und Kerben eines Schlüssels, um die sogenannten Zähne im Schloss aufzuhebeln und es so zu öffnen. Hierzu muss bei einem komplizierteren Schloss auch mehr als ein Dietrich verwendet werden. Zum Anheben der Schlosszähne muss zudem der Dietrich oftmals im Schloss gedreht und weiter hineingesteckt werden. Vor einem zwergischen Kombinationsschloss kapituliert dennoch jeder Dietrich, denn diese speziellen Sicherheitsschlösser bieten dem Dietrich keinerlei Einlass. Vor allem Schmiede sind dazu in der Lage, nach allen Wünschen und Bedürfnissen Dietriche anzufertigen – und selbst zwielichtigen Personen werden solche Maßanfertigungen angeboten, wenn sie den nötigen Preis für das Schweigen aufbringen können. Aber auch für den spontanen Einbruch hat der erfahrene Abenteurer eine Lösung gefunden: \n\nDie Spitze eines Dolches mag schon so manches alte Schloss knacken, und selbst Zofen, die beispielsweise ihre Herrin bespitzeln, bedienen sich eines einfachen Tricks, um den Dietrich zu ersetzen oder einen Einbruch zu verschleiern, indem sie die ein oder andere Haarnadel nicht bloß zum Schmuck tragen. Allerdings ist es deutlich zeitaufwendiger, mit einem improvisierten Dietrich zu arbeiten. Sollte es also schnell gehen müssen, wäre es ratsam, den richtigen Schlüssel oder ein Set mit Dietrichen zur Hand zu haben. Da viele Gläubige der Phexkirche in dem Verdacht stehen, nichts anderes als geschickte Gauner im Göttergewand zu sein, wird der Dietrich auch gerne als Phexens liebstes Spielzeug bezeichnet.",
      "DREHLEIER_DESCRIPTION": "Keine Beschreibung",
      "DREIZACK_DESCRIPTION": "Keine Beschreibung",
      "DRESCHFLEGEL_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_AMETHIST_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_AQUAMARIN_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_AVENTURIN_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_BERGKRISTALL_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_BERNSTEIN_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_DIAMANT_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_GRANAT_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_GRUENE_JADE_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_KARNEOL_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_LAPISLAZULI_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_MONDSTEIN_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_ONYX_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_OPAL_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_PERLE_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_RUBIN_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_SAPHIR_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_TOPAS_DESCRIPTION": "Keine Beschreibung",
      "EDELSTEIN_TUERKIS_DESCRIPTION": "Keine Beschreibung",
      "EGELSCHRECKPASTE_DESCRIPTION": "Proben zum Stoppen von Blutungen sind um +4 erleichtert.",
      "EINBEERENTRANK_DESCRIPTION": "Während einer Rast von mindestens einer Stunde regeneriert der Trinkende eine Wunde. Bei mehr als einer Einnahme pro Tag droht die Einbeerensucht (1-8 auf dem W20).",
      "ELIXIERE_DER_TUGEND_DESCRIPTION": "Für 1 Stunde sind Proben auf ein bestimmtes Attribut um +2, Fertigkeitsproben mit diesem Attribut um +1 erleichtert.",
      "ERSCHOEPFUNGSPILLEN_DESCRIPTION": "Heilen sofort 2 Punkte Erschöpfung.",
      "ESSBESTECK_DESCRIPTION": "Keine Beschreibung",
      "EULENTRAENEN_DESCRIPTION": "Der Trinkende ignoriert für 4 Stunden eine Stufe Dunkelheit, aber grelles Licht erschwert alle Proben um –2. Bei absoluter Dunkelheit ist der Trank wirkungslos.",
      "FACKEL_DESCRIPTION": "Fackeln sind eine in ganz Aventurien beliebte und bekannte Möglichkeit der Beleuchtung. Sie lassen sich gut transportieren, brennen relativ lange, auch bei Regenwetter, und spenden viel Licht. Auch dass sie meistens recht stark rußen, kann diese Vorteile nicht aufwiegen und etwas an ihrer großen Beliebtheit bei Entdeckern mindern.\n\n Ihr Hang zum Funkenflug macht sie unter strohgedeckten, niedrigen Dächern gefährlich, doch in steinernen Pyramiden, dunklen Tunneln und finsteren Kerkern sind sie das beste und oft auch charakteristischste Leuchtmittel. Häufig gibt es in Steingebäuden an der Wand befestigte Halter, um eine Fackel aufzunehmen. Auch im Freien werden sie gern verwendet, so gibt es im Horasreich und in den Tulamidenlanden verzierte Fackelhalter für die Illuminierung rauschender Gartenfeste.\n\n Fackeln bestehen aus einem Stück Holz, das an der Spitze mit einem Stofffetzen oder Seil umwickelt und anschließend in Öl oder Pech getaucht wurde. Fackeln gibt es auf den meisten Märkten zu kaufen, sie lassen sich aber in der Not auch mit einem Stück des eigenen Gewands oder einer Handvoll Stroh und etwas Lampenöl improvisieren.",
      "FALSCHER_BART_DESCRIPTION": "Keine Beschreibung",
      "FANFARE_DESCRIPTION": "Keine Beschreibung",
      "FEDERKIEL_DESCRIPTION": "Keine Beschreibung",
      "FEDERMESSER_DESCRIPTION": "Keine Beschreibung",
      "FEILE_DESCRIPTION": "Keine Beschreibung",
      "FEINWERKMECHANIKER_WERKZEUG_DESCRIPTION": "Keine Beschreibung",
      "FELDFLASCHE_DESCRIPTION": "Diese meist aus gehärtetem Leder bestehenden Trinkgefäße eignen sich wunderbar, um unterwegs keinen Durst leiden zu müssen. Durch einen Stopfen aus Kork (oder gelegentlich auch Bienenwachs) verschließt man die entweder bauchige oder schlauchförmige Feldflasche und hat so seinen Lieblingstrunk immer griffbereit, egal ob direkt am Körper getragen oder im Rucksack verstaut. Oft gesehen sind Lederschlaufen, die sich durch Riemen und Schlitze am Gürtel befestigen lassen. In diese Schlaufen kann die Feldflasche eingehängt oder festgezurrt werden, damit sie beim schnellen Gang oder Ritt nicht herunterfällt. Auch ist man so flexibler dabei, sie aus der Hand zu legen, sollte man etwa eine Waffe ziehen müssen. Die Wirtsleute aventurischer Kneipen und Tavernen sind daran gewöhnt, dass Abenteurer vor Antritt einer langen Reise ihre Feldflasche auffüllen lassen wollen. Sofern man sich nicht scheut, Wasser aus dem Brunnen zu verwenden oder aus dem Trog mit Regenwasser zu schöpfen, ist dies meist sogar kostenlos möglich.\n\n Im Gegensatz zum Wasserschlauch hat die Feldflasche eine feste Form und lässt sich weder ausdehnen noch falten. Ihr Gebrauch ist für den Transport einer kleinen Menge Flüssigkeit bestimmt, die man schnell zur Hand haben möchte, wogegen der Wasserschlauch mehrere Maß umfasst.",
      "FERNROHR_DESCRIPTION": "Auch in Aventurien nutzen Seefahrer, Piraten, Astrologen, Kundschafter und Entdecker Fernrohre. In einigen Regionen sind diese Geräte nahezu unbekannt, in anderen deutlich häufiger. Aber immer sind sie teuer in der Anschaffung und für die allermeisten kein alltäglicher Gegenstand.\n\n Am weitesten verbreitet ist ein handliches Fernrohr von etwa einem Drittel Schritt Länge, mit dem sich entfernte Objekte besser erkennen lassen. Das Rohr ist aus Metall oder Holz, ganz schlicht oder mit nautischen oder astrologischen Symbolen verziert. Auch das Wappen des Besitzers ist sehr beliebt. Es gibt eine starre Ausfertigung und eine leicht teurere zum Zusammenschieben. Sternkundler bevorzugen, außer auf der Reise, ein grö- ßeres Fernrohr mit stärkerer Vergrößerung, die größten Exemplare sind die gewaltigen Teleskope der Sternwarten. Entsprechende Fernrohre für Observatorien sind immer Spezialanfertigungen, gibt es doch kaum mehr als eine Handvoll entsprechend ausgerüstete Sternwarten in Aventurien. Gleiches gilt auch für die ebenfalls seltenen kleinen Fernrohre, die vor allem bei Spionen, Dieben und anderen Phexensjüngern verbreitet sind und sich in einer Gürteltasche verstecken lassen.\n\n Da das korrekte Montieren und vor allem Schleifen der Linsen aufwändig ist und besonderes Fachwissen erfordert, sind Fernrohre nur in großen Städten erhältlich. Besonders in Seefahrerfamilien werden sie oft weitervererbt und es gilt als große Ehre, ein solches Exemplar als Geschenk zu bekommen.",
      "FESSELSEIL_DESCRIPTION": "Unter einem Fesselseil wird üblicherweise ein dünner, fester Strick von etwa einem Schritt Länge verstanden. Dieser ist aus Pflanzenfasern, wie zum Beispiel Hanf, oder verdrehtem Leder hergestellt, maximal so dick wie ein kleiner Finger, aber außerordentlich reißfest. Ein solches Seil ist gut geeignet, um jemanden zu fesseln, viele Gardisten und auch Schergen von brutalen Unterweltgrößen tragen extra zu diesem Zweck ein oder zwei entsprechende Exemplare mit sich.\n\n Seine effektive Anwendung zur Fesselung erfordert jedoch vor allem gute Knoten und die richtige Technik. In einer besonders grausamen Variante werden Fesselseile aus Leder vor der Verwendung angefeuchtet. Da sich Leder beim Trocken zusammenzieht, werden derartige Fesseln mit der Zeit immer enger. Dieser Effekt ist mit Seilen aus anderem Material jedoch nicht möglich. Aufgrund der Vielzahl der Verwendungsmöglichkeiten und der weit verbreiteten Materialien gibt es Fesselseile fast überall zu kaufen.",
      "FEUERSTEIN_UND_STAHL_DESCRIPTION": "Früher oder später wird ein Held auf Reisen, sollte er gezwungen sein, in der Wildnis zu nächtigen, ein Feuer machen wollen. Sei es, um nach Travias Gunst an einem warmen Lagerfeuer zu sitzen, zu rasten und zu speisen, oder um nach Ingerimms feuriger Weisung ein Schmiedefeuer zu entfachen, denn selbst dem erfahrensten Streiter Aventuriens bricht schon mal die Klinge. Ein Feuer hält zudem Wildtiere ab. Um dies zu bewerkstelligen, benutzen Aventurier meist Feuerstein und Stahl. Der Feuerstein, ein aschgraues Gestein, findet sich in vielen Gebirgen und kommt häufig vor. Auf jedem guten Markt und in jeder Schmiede wird man fündig werden.\n\n Schlägt man diese Steine im geeignetem Winkel gegen ein Stück Stahl oder schleift sie schnell daran, so vermögen sie Funken zu werfen, die sich gut zur Bildung einer Glut auf trockenen Ästen, Blättern oder Zunder eignen. Der Glaube hält sich stark unter Zwölfgöttergläubigen, dass Ingerimm den Feuersteinen die Macht verlieh, aus kleinen Funken herrlich brennende Flammen erstehen zu lassen. In einer Gruppe aus Abenteurern herrscht selten ein Mangel an Stahl, denn schlecht vorbereitet wären die Helden, führten sie keine Waffe aus gehärtetem Stahl mit sich. Speziell zum Zwecke des Feuermachens werden Stahlstücke in jeder Schmiede angeboten. Unter einiger Anstrengung gelingt es auch durch das Aneinanderschlagen zweier solcher Stahlstücke, einen Funken zu erzeugen.",
      "FIBEL_DESCRIPTION": "Keine Beschreibung",
      "FIRNKLINGE_DESCRIPTION": "Keine Beschreibung",
      "FLASCHENZUG_MAX_250_STEIN_DESCRIPTION": "Keine Beschreibung",
      "FLEISCHERBEIL_DESCRIPTION": "Keine Beschreibung",
      "FLOETE_DESCRIPTION": "Keine Beschreibung",
      "FURCHTLOS_TROPFEN_DESCRIPTION": "Für 1 Stunde sinken Furcht-Effekte um eine Stufe.",
      "GEHEIMTINTE_DESCRIPTION": "Die Tinte wird erst durch Hitzeeinwirkung oder eine bestimmte Flüssigkeit sichtbar. Uneingeweihte können diese Flüssigkeit mit einer Analyse-Probe (16) sichtbar machen.",
      "GELDBEUTEL_DESCRIPTION": "Keine Beschreibung",
      "GOETTERFIGUERCHEN_DESCRIPTION": "Keine Beschreibung",
      "GRAVURWERKZEUG_DESCRIPTION": "Keine Beschreibung",
      "GUERTELTASCHE_DESCRIPTION": "Keine Beschreibung",
      "GULMONDTEE_DESCRIPTION": "Der Trinkende kann eine KO-Probe (Krankheitsstufe) ablegen. Gelingt sie, erleidet er an diesem Tag nur den halben Schaden (abgerundet) durch die Krankheit.",
      "GWEN_PETRYL_STEIN_DESCRIPTION": "Da nicht jede Situation in Dunkelheit nach einem Feuer schreit und es gar auch Helden gibt, denen offene Flammen und Fackeln nicht geheuer sind, findet auch schon mal ein Gwen Petryl-Stein seinen Weg in die Rucksäcke der Abenteurer. Als die Zitadelle von Alveran während der Gigantenkriege zerstört wurde, sollen Bruchstücke davon auf Dere gefallen sein. Dort verschluckten vor allem Efferds wü- tende Wogen das seltene Gestein. Durch seine Gunst werden oftmals kleinere sowie größere Steinstücke an Küsten angeschwemmt. Strandgutsammlern fallen diese Steine schon von Weitem durch ihr starkes grün-blaues Leuchten auf. In seltenen Fällen sollen auch schon gelblich-orange leuchtende Steine gefunden worden sein. Die Gerüchte halten sich außerdem, dass auch hellrot leuchtende Steine gesichtet wurden. Der Leuchtradius ist dabei abhängig von der Größe des Steins, halb-faustgroße Steine, die am häufigsten gefunden werden, erhellen bis zu einige Schritt weit dunkle Höhlen, ähnlich dem Schein einer Fackel.\n\n Es heißt, der Gwen Petryl sei Efferd heilig. Auch als Efferdfeuer bezeichnet, findet sein Leuchten vor allem in der Kirche des Meervaters Verwendung. Ob als Leuchtfeuer in Küsten- oder Leuchttürmen, als Raumbeleuchtung oder als Fackelersatz, etwa indem man den Gwen Petryl-Stein in ein Fischernetz hüllt und vor sich her trägt – das seltene Gestein wird dort oft genutzt, nicht zuletzt, weil offenes Feuer im Efferdtempel streng verboten ist. Nur Wärme vermag dieser wundersame Stein nicht zu spenden. Obwohl sich der Verdacht hält, das starke Leuchten wäre magischer Natur, kommen Vertreter aller Zwölfgötter zu dem Schluss, dass es einen karmalen Ursprung für die Eigenschaften des Gwen Petryl geben muss. Gwen Petryl-Steine sind nebst anderen Gaben beliebte Opfer an den Gott der Meere. Die Efferdkirche verlangt zudem die Abgabe jedes Leuchtsteins, der mindestens die Größe einer Faust erreicht.\n\n Abgesehen von Küstengebieten können Gwen Petryl-Steine auch in größeren Gebirgsketten gefunden werden, und vor allem in den Salamandersteinen, einem Gebirgszug Nordaventuriens, sollen mehrere dieser Steine aufgetaucht sein. Gut informierte Abenteurer reisen gern auch nach Havena, da man dort viele Steine auf dem Markt findet, und das zu ausgesprochen günstigen Preisen. Ob das Monopol der Efferdkirche in Anbetracht der Tatsache, dass das Gestein nicht nur vom Meer angespült wird, sondern auch noch andernorts auftaucht, gerechtfertigt ist, bleibt strittig. Es ist unklar, ob andere Götter ein ähnliches Interesse an dem Leuchtstein haben, doch Priester der Charyb’Yzz behaupten, der Gwen Petryl-Stein wäre einzig ihrer Gottheit heilig, und gerade bei den rötlicheren Steinen drängt sich der Verdacht auf, dass Praios einen Anspruch darauf hätte.",
      "HAENGEMATTE_DESCRIPTION": "Keine Beschreibung",
      "HALSKETTE_DESCRIPTION": "Keine Beschreibung",
      "HAMMER_DESCRIPTION": "Keine Beschreibung",
      "HANDAXT_DESCRIPTION": "Keine Beschreibung",
      "HANDBOHRER_DESCRIPTION": "Keine Beschreibung",
      "HANDHARFE_DESCRIPTION": "Keine Beschreibung",
      "HANDSAEGE_DESCRIPTION": "Keine Beschreibung",
      "HANDSPIEGEL_DESCRIPTION": "Keine Beschreibung",
      "HEILTRANK_DESCRIPTION": "Kampfunfähigkeit und Blutungen werden geheilt. Außerdem erhält das Ziel 2W6+4 Heilpunkte, für jede Überschreitung der WS wird eine Wunde geheilt.",
      "HEXENKUECHE_DESCRIPTION": "Keine Beschreibung",
      "HOLZFAELLERAXT_DESCRIPTION": "Keine Beschreibung",
      "HOLZSCHALE_DESCRIPTION": "Keine Beschreibung",
      "HOLZTELLER_DESCRIPTION": "Keine Beschreibung",
      "HYLAILER_FEUER_DESCRIPTION": "Die ölige Flüssigkeit entzündet sich, wenn ihr Behältnis zerbricht und ist nicht mit Wasser zu löschen. Bei 1–15 auf dem 1W20 versagt das Hylailer Feuer.",
      "JONGLIERBALL_DESCRIPTION": "Keine Beschreibung",
      "KABASFLOETE_DESCRIPTION": "Keine Beschreibung",
      "KAFFEE_GEROESTET_DESCRIPTION": "Keine Beschreibung",
      "KAKAO_DESCRIPTION": "Keine Beschreibung",
      "KALTES_LICHT_DESCRIPTION": "Senkt die Stufe der Dunkelheit in einem Radius von 4 Schritt um 1 Stufe. Das Kalte Licht wirkt für 4 Stunden.",
      "KAMELSPIEL_DESCRIPTION": "Rote und Weiße Kamele, oder kurz nur Kamelspiel genannt, ist das berühmteste Brettspiel der Tulamidenlande, aber auch in anderen Teilen Aventuriens ist es weit verbreitet. Wie alt das Spiel genau ist, weiß niemand zu sagen, aber es soll bereits zu Zeiten der Urtulamiden gespielt worden sein. Es wird in Palästen ebenso gespielt wie in den zahlreichen Teehäusern und Karawansereien, von Frauen, Männern und auch Kindern, unter guten Freunden ebenso wie in einer gepflegten Feindschaft.\n\n Rote und Weiße Kamele wird üblicherweise zu zweit gegeneinander gespielt, wobei jeder Spieler eine zu Beginn festgelegte Anzahl Kamele und Waren bekommt. Mit diesen Kamelen können Karawanen zusammengestellt und über das Spielfeld geführt werden, um die eigenen Waren möglichst lukrativ einzusetzen. Außerdem können Kamele, statt eine Karawane zu bilden, auch als Kriegskamele eingesetzt werden, um die Karawanen des Gegners zu erobern und so dessen Pläne zu vereiteln. Strategisches Denken und Geschäftssinn sind dem Erfolg beim Kamelspiel zuträglich, aber nicht allein ausschlaggebend, es kommt auch auf Glück an. \n\nGespielt wird auf dem Boden, einem Tisch oder einem Teppich, je nach Situation und Geldbeutel des Spielbesitzers möglicherweise sogar auf einem ausschließlich dafür verwendeten oder extra hergestellten Exemplar. Die Spielfiguren sind bei armen Leuten oft kaum mehr als Kieselsteine oder hölzerne Schnitzereien, doch in vermögenden Kreisen kann das Spiel nicht prächtig genug sein. Farbiges Glas, Elfenbein, Unauer Porzellan, Alabaster und natürlich Gold und Edelsteine sind einigen Potentaten kaum gut genug für die Spielfiguren, magische Metalle und andere seltene Materialien müssen es sein. Auch ein fliegender Teppich soll schon als Spielfeld gedient haben.\n\n Besonders über zauberkräftige Herrscher in Gegenwart und Vergangenheit wird immer wieder berichtet, sie hätten magische Kamelspiele, die sich selbst spielen oder den Spieler beraten. Von anderen Spielen dagegen heißt es, sie seien verflucht und brächten jedem Unglück, der sie verwendet. Und in mehr als einem Märchen wird von besonders grausamen Zaubersultanen berichtet, die ihre Feinde in Figuren für ihr Kamelspiel verwandelten, wohingegen andere finstere Gestalten von listigen Helden bei einer Partie Rote und Weiße Kamele um ihr Leben oder ihre Kräfte gebracht worden sein sollen.\n\n Etliche Tulamiden sehen es als das phexgefälligste Spiel überhaupt an und viele haben schon ihr gesamtes Vermögen oder auch ein Herrschaftsgebiet in einer einzigen Partie verloren – oder gewonnen.",
      "KAMM_DESCRIPTION": "Keine Beschreibung",
      "KARTOGRAPHIEWERKZEUG_DESCRIPTION": "Reisende Abenteurer, Gelehrte und Seeleute, aber auch Diebe und Gesetzeshüter kommen immer wieder in die Situation, eine Karte anfertigen zu wollen. Während sich eine schnelle Übersichtsskizze einfach erstellen lässt, werden für eine gute Karte neben Papier und Schreibwerkzeug noch einige andere Werkzeuge benötigt. Vorwiegend sind dies Lineal, Zirkel, verschiedenfarbige Tinten und eine gute Lichtquelle, außerdem ein Messer. Letzteres dient dazu, Feder oder Stift immer angespitzt zu halten, damit jeder Strich mit Präzision durchgeführt werden kann. Zirkel und Lineal dienen dazu, Entfernungen und Abstände abzumessen und zu übertragen, damit der Maßstab der Karte in sich stimmig ist.\n\n Aventurische Gelehrte streiten sich, wie eine gute Karte auszusehen hat. Wo der Mittelpunkt einer Weltkarte sein soll oder welche Seite der Karte nach oben zeigt, ob die Karte also genordet oder gesüdet werden soll, wird immer wieder heftig diskutiert. Üblich ist es jedoch meistens, den Südpfeil der Windrose stärker zu betonen als den Nordpfeil, schließlich zeigt der aventurische Kompass auch nach Süden.",
      "KERZENSTAENDER_DESCRIPTION": "Ein prächtiger Ständer. Mindestens 20 Fingerbreit ragt er gerade und glänzend in die Höhe. Vorsicht, sonst gibt es Wachsflecken.",
      "KERZE_DESCRIPTION": "Kerzen finden in ganz Aventurien Verwendung. Sie beleuchten Bauernkaten, Paläste, Tempel und Bibliotheken. Außerdem sind sie ein leicht transportierbares Leuchtmittel, das gut in eine freie Ritze im Rucksack passt und auch nach einem unfreiwilligen Bad noch funktionsfähig ist.",
      "KETTE_10_SCHRITT_DESCRIPTION": "Keine Beschreibung",
      "KIEPE_DESCRIPTION": "Keine Beschreibung",
      "KLETTERHAKEN_DESCRIPTION": "Zusätzlich zu dem von Abenteurern oft mitgeführten Kletterseil haben viele Helden auf Reisen außerdem einige Kletterhaken im Gepäck. Denn sollte man planen, Berge zu besteigen, oder Schluchten und Schächte herunterzuklettern, dann wird man gewiss auch wieder den umgekehrten Weg zurück nehmen wollen.\n\n Der Kletterhaken besteht meist aus ein oder zwei gespitzten Stahlstäben, die in einem rechten Winkel gebogen und mit einem Ring verbunden sind. Auch dickere Kletterseile lassen sich problemlos durch diesen Ring führen und sichern dem Abenteurer so einen guten Aufstieg.\n\n Mit einem einfachen Handhammer lässt sich der Kletterhaken mit etwas Druck und Kraftaufwand in jede Felswand schlagen. Dabei ist Vorsicht geboten, keine Schuttlawine auszulösen und einen sicheren Halt in der Wand zu finden. Steckt der Haken fest, wird so das Seil an der zu erkletternden Fläche gehalten und der Haken dient zudem als Trittstück, sollte es der Kletterfläche an kleineren Auswüchsen und Absätzen mangeln.\n\n Geübte Fassadenkletterer werden meist weniger Unterstützung durch Kletterhaken brauchen und eher zum Wurfhaken greifen, Bergsteiger dagegen haben garantiert beides immer dabei und sind mit dem Umgang vertraut. Ohne ein Kletterseil bringen die Kletterhaken hingegen so gut wie keine Vorteile. Zwar kann ein kletternder Held sich bisweilen an ihnen festhalten, aber sie eignen sich dazu kaum besser als ein kleiner Felsvorsprung.",
      "KLETTERSEIL_DESCRIPTION": "Viele reisende Abenteurer wissen, dass es nie schaden kann, ein Seil mitzunehmen. Deswegen gehört das Kletterseil bei ihnen zum Standardgepäck. Darüber hinaus werden Kletterseile von Bergarbeitern, Einbrechern und Seeleuten verwendet, aber auch unter anderem Namen zu anderem Zweck von vielen weiteren Aventuriern.\n\n Ein Kletterseil ist üblicherweise nur ein schlichtes Seil. Wie gut es geeignet ist, um sich damit vor einem Absturz zu retten oder den Aufstieg zu erleichtern, hängt dabei von der Qualität der befestigenden Knoten ab.\n\n Kletterseile sind normalerweise aus Hanf gefertigt und mindestens 20 Schritt lang, es gibt auch längere und kürzere Versionen zu kaufen. Dazu sind sie so belastbar, dass sie das Gewicht mehrerer Menschen tragen können. Allerdings sind sie dadurch auch mindestens fingerdick und nicht ganz leicht. Aus diesem Grund investieren besonders Einbrecher, aber auch reisende Forscher, oft in ein Seidenseil. Dieses ist zwar deutlich teurer und anders als normale Seile selten zu bekommen, allerdings dünn, leicht und dabei immer noch stabil.\n\n Kletterseile lassen sich auch anderweitig verwenden, sie sind geeignet, um Hängebrücken zu reparieren, einen Karren aus dem Graben zu ziehen, eine Absperrung zu improvisieren und vieles mehr. Um jemanden zu fesseln, sind sie jedoch üblicherweise zu dick, außer der Gegner wird in die Seilrolle eingewickelt.",
      "KOHLESTIFT_DESCRIPTION": "Keine Beschreibung",
      "KOMPASS_SUEDWEISER_DESCRIPTION": "Der Kompass wird von den meisten Aventuriern als Südweiser bezeichnet, denn die Nadel dieses Geräts weist stets nach Süden. Viele bekommen jedoch in ihrem ganzen Leben keinen zu Gesicht, denn Südweiser sind alles andere als alltäglich. Nur in der Nautik und bei einigen reisenden Abenteurern sind Südweiser recht verbreitet. Denn der Kompass zeigt immer zuverlässig die Himmelsrichtungen an, unabhängig vom Wetter und überall, wo es Helden hin verschlägt, sei es im tiefsten Dschungel, auf See oder in unterirdischen Katakomben.\n\n Ein üblicher Südweiser hat die Himmelsrichtungen auf eine runde Fläche gemalt, über der ein drehbarer Zeiger, Nadel genannt, angebracht ist, deren eines Ende sich stets nach Süden ausrichtet.\n\n Unter Seeleuten verbreitete, kleine Kompasse haben meist einen Deckel, um die sensible Mechanik vor den Unbilden des Wetters schützen zu können. Besonders prächtige Exemplare sind mit Einlegearbeiten aus farbigem Glas, Edelmetallen oder Juwelen verziert. Südweiser gibt es in verschiedenen Größen, die meisten lassen sich in einer Hand halten, doch auf einigen Schiffen, in Kapitänsschulen oder Palästen lassen sich wagenradgroße, hängende oder in eine Tischplatte eingebaute Exemplare bewundern.\n\n Bei den meisten Kompassen ist die Windrose mit den Himmelsrichtungen beschriftet, besonders fromme Mechaniker verwenden jedoch Götternamen: Praios steht dabei für den Süden und Firun für Norden, Efferd bezeichnet den Westen, Rahja oder Aves Osten. Auch wird die Windrose oft um nautische oder mythische Details ergänzt.\n\n Einen Südweiser herzustellen, erfordert neben mechanischem Geschick auch das richtige Material: die Nadel enthält immer wenigstens eine winzige Menge Meteoreisen. Dieses geheimnisvolle Metall ist selten und teuer, doch ohne seine Zugabe richtet sich die Kompassnadel nicht korrekt aus.\n\n Südweiser sind den Aventuriern schon seit Jahrtausenden bekannt, bereits die Urtulamiden und alten Bosparaner verwendeten sie zur Navigation auf See. Doch nicht nur Menschen kennen und nutzen Südweiser, auch Achaz und besonders Zwerge schätzen das Gerät seit langer Zeit.\n\n Da die Nadel des Südweisers weder magnetisch noch in irgendeiner Weise magisch ist, rätseln aventurische Gelehrte, warum die Nadel sich stets nach Süden ausrichtet. Über eine noch unbekannte Energie wird dabei ebenso spekuliert wie über Praios’ Ordnung. Einige Geoden und Druiden, die sich mit dem Phänomen des Magnetismus auskennen, nehmen an, dass sich weit im Süden etwas befindet, das die Spitze der Nadel anzieht. Darüber, was genau es ist, herrscht jedoch keine Einigkeit, von der ewigen Zitadelle des Elements Feuer ist dabei ebenso die Rede wie von einem übergroßen anziehenden Berg oder einem gestürzten Stern.",
      "KOPFTUCH_DESCRIPTION": "Keine Beschreibung",
      "KREIDE_DESCRIPTION": "Kreide ist ein beliebtes Schreibmaterial bei Gelehrten, Bergleuten und lichtscheuen Zeitgenossen. Erstere beschreiben damit Schiefertafeln, während sie über ein wissenschaftliches Problem nachdenken, oder lassen Schüler mit Kreide die ersten Buchstaben malen. Bergleute und reisende Abenteurer markieren sich in un- übersichtlichen Labyrinthen an den Wänden ihren Weg mit Kreidezeichen. Ähnliches tun auch Diebe und Streuner mit ihren an Häuser gemalten Zinken, sie markieren dabei jedoch eher weniger Wege als vielmehr lohnende Ziele oder Bandenterritorien. \n\nDie einfachste Form, an ein Stück Kreide zu gelangen, ist, ein Stück des entsprechenden, gleichnamigen Gesteins zu nehmen. Allerdings neigt es durch seine ungleichmäßige Struktur dazu, Kratzspuren zu hinterlassen, weshalb die meisten Gelehrten lieber Schreibkreide benutzen. Für diese wird das Gestein gemahlen, gesiebt und die zurückbleibenden feinen Stückchen werden mit Flüssigkeit zu Brei verrührt, der anschließend in Formen gepresst getrocknet wird.",
      "KRISTALLKUGEL_DESCRIPTION": "Keine Beschreibung",
      "KRUG_DESCRIPTION": "Keine Beschreibung",
      "KUGEL_DESCRIPTION": "Kugel für Torsionsgeschütz",
      "KUKRIS_DESCRIPTION": "Ein tödliches Einnahme- und Waffengift (Stufe 24).",
      "KUPFERKESSEL_DESCRIPTION": "Kessel gibt es aus verschiedenen Metallen, doch die meisten Aventurier bevorzugen ein Exemplar aus Kupfer. Es rostet kaum, wird schnell warm und sieht außerdem noch gut aus. Kupferkessel sind ideale Kochutensilien, außerdem lässt sich in ihnen braten und auch für die Ausstattung eines alchimistischen Labors sind sie gut geeignet. So mancher reisende Abenteurer hat auch schon andere Verwendungsmöglichkeiten für einen Kessel gefunden, als Eimer, als Wohnort für einen magischen Fisch oder als improvisierter, wenig hilfreicher, aber eindrucksvoller Helm.\n\n Kupferkessel werden in unterschiedlichen Größen hergestellt, die kleinsten fassen kaum mehr als eine Schüssel. Die größten Exemplare dagegen lassen sich kaum alleine bewegen, schon gar nicht, wenn sie mit heißer Suppe gefüllt sind.\n\n Da Kupfer Orange, der Farbe der Göttin Travia, sehr ähnlich sieht, gilt es in besonders frommen Haushalten als außerordentlich wichtig, die kupfernen Kessel und Pfannen stets auf Hochglanz zu polieren. Der seltene Schmuck eines Traviatempels wird auch häufig aus Kupfer gefertigt und viele Geweihte sehen große Kupferkessel als den wichtigsten Schmuck ihres Gotteshauses.\n\n Ähnlich wie Alchimisten nutzen Hexen kupferne Kessel nicht nur zum Kochen, sondern auch zum Brauen von besonderen Tränken und Salben. Gerüchten zufolge sollen sie auch magische Kessel besitzen, die Tote zum Leben erwecken können oder andere geheimnisvolle Dinge bewerkstellen können.",
      "LAMPENOEL_12_STUNDEN_DESCRIPTION": "Keine Beschreibung",
      "LATERNE_DESCRIPTION": "Laternen sind in ganz Aventurien bekannt und geschätzt, denn sie schützen das Licht in ihrem Inneren vor Regen und Windstößen und die Umgebung vor ungeplantem Entzünden. Besonders großer Beliebtheit erfreuen sie sich in Mittel- und Nordaventurien, im Bergbau und auf See, die Öllaterne auch in den Tulamidenlanden.\n\n Die einfachste Version ist die Kerzenlaterne, bei der die Lichtquelle in der Lampe eine Kerze ist. Deutlich heller, aber auch etwas teurer, ist die Öllaterne, die einer Öllampe mit Schutzgehäuse entspricht. Beide Varianten haben jedoch einen Nachteil: Das Licht strahlt von der Laterne aus gleichmäßig in alle Richtungen. Um es zu löschen, muss die Laterne je nach Bauart erst abgesetzt und geöffnet werden. Ein darübergeworfener Mantel verbirgt das Licht zwar, droht aber anzukokeln.\n\n Um diesen Missstand zu beheben, wurde die Blendlaterne erfunden. Diese hat ein Metallgehäuse mit Schiebern, die sich über die Lichtöffnungen bewegen lassen und so das Licht auf einen Bereich fokussieren oder komplett abblenden. Es ist ungewiss, ob sie ursprünglich von Bergleuten erdacht wurde, um gezielt bestimmte Bereiche ausleuchten zu können, oder von phexgefälligen Handwerkern, die es mit dem Eigentum anderer Leute nicht so genau nahmen.",
      "LAUTE_DESCRIPTION": "Keine Beschreibung",
      "LEIM_DESCRIPTION": "Keine Beschreibung",
      "LIEBESTRUNK_DESCRIPTION": "Im Trinkenden entbrennt Leidenschaft für die erste Person, die er erblickt. Auf einer Skala von abstoßend/uninteressant/neutral/begehrenswert/unwiderstehlich steigt seine Einstellung um eine Stufe.",
      "LIPPENROT_DESCRIPTION": "Keine Beschreibung",
      "MAGIERROBE_DESCRIPTION": "Keine Beschreibung",
      "MANTEL_DESCRIPTION": "Mäntel können in Aventurien vieles sein, von einem überlebenswichtigen Kälteschutz bis hin zu einem modischen Accessoire. Verbreitet sind sie auf dem ganzen Kontinent, doch nicht jeder versteht dasselbe darunter. Für einen Fjarninger ist ein guter Pelz, um die Schultern gelegt, ein Mantel, im Süden dagegen reicht ein zarter Seidenschleier, und modebewusste Horasier kennen gleich mehrere Arten Mäntel.\n\n Für eine Reise wird fast überall ein knielanger Mantel bevorzugt, der vor Regen und auch einigermaßen vor Kälte schützt. Ob mit oder ohne Kapuze, ist dabei eine Geschmacksfrage. Gleiches gilt für Ärmel oder Öffnungen für die Arme, auch ein Umhang gilt in Aventurien als Mantel. Über den reinen Wetterschutz und das Setzen eines modisch-gesellschaftlichen Akzentes hinaus lassen sich Mäntel für viele weitere Dinge verwenden, zum Beispiel als Decke oder improvisierter Beutel. Extravagante Fechter benutzen einen Mantel mitunter auch als Parierwaffe.\n\n Einige Mäntel haben es zu großer Berühmtheit gebracht, besonders natürlich die Krönungsmäntel verschiedener Herrscher. Die Traviakirche hütet mit dem Mantel der Heiligen Mascha den Mantel einer Heiligen. Dieser hat die wundersame Eigenschaft, sich in Decken für Frierende teilen zu lassen. Und viele, vor allem tulamidische Märchen berichten von magischen Mänteln, die ihren Träger unsichtbar oder unverwundbar machen oder ihm andere, zauberhafte Fähigkeiten verleihen.",
      "MEISSEL_DESCRIPTION": "Keine Beschreibung",
      "NADEL_UND_ZWIRNSET_DESCRIPTION": "Keine Beschreibung",
      "NAEGEL_10_STUECK_DESCRIPTION": "Keine Beschreibung",
      "NAEHKAESTCHEN_DESCRIPTION": "Keine Beschreibung",
      "NAGELFEILE_DESCRIPTION": "Keine Beschreibung",
      "NUDELHOLZ_DESCRIPTION": "Kaum jemand würde auf die Idee kommen, ein Nudelholz als Waffe zu benutzen. Dennoch kann man hin und wieder erleben, dass ein Zuckerbäcker sein Nudelholz ergreift, um damit Jagd auf Tortendiebe zu machen. Im Gegensatz zu einem Knüppel, der zwar auch keine ideale Waffe ist, zerbricht ein Nudelholz aber oft schon während eines ersten Schlagabtauschs mit einer anderen Waffe.\n\n Gefährlich wird das Holz aber, wenn man damit einen Schlag gegen den Kopf bekommt. Es kann so leicht zu Desorientierung führen und steht in dieser Hinsicht einer echten Keule in nichts nach.\n\n Allerdings werden nur wenige Helden wohl jemals mit einem Teigholz kämpfen müssen. Vielmehr stellt es die letzte Verteidigungsmöglichkeit eines reisenden Traviageweihten oder einer Zuckerbäckerin dar, aber es handelt sich nicht um eine echte Waffe.",
      "OELLAMPE_DESCRIPTION": "Keine Beschreibung",
      "OHRRING_DESCRIPTION": "Keine Beschreibung",
      "OLGINSUD_DESCRIPTION": "Der Trinkende ist eine Woche immun gegen Gifte und Krankheiten bis Stufe 20.",
      "PAPIER_DESCRIPTION": "Papier und Pergament darf in Tempeln, Magierakademien, Kontoren, in der Verwaltung und allen anderen Horten der Gelehrsamkeit nicht fehlen, selbst wenn letztere nur aus dem Rucksack eines reisenden Entdeckers bestehen. Die beiden Begriffe werden auch in Aventurien häufig gleichbedeutend benutzt, bezeichnen jedoch zwei unterschiedliche Schreibmaterialien.\n\n Pergament wird aus ungegerbter Tierhaut hergestellt. Diese wird mit Wasser, Kalk und weiteren alchimistischen Substanzen eingeweicht, von allen Haaren befreit und anschließend glattgeschabt. Damit die Schreibfläche möglichst glatt und fein ist, muss eine möglichst feine Haut verwendet werden, das beste Pergament entsteht aus der Haut neugeborener Lämmer. Aufgrund des Ausgangsmaterials ist die maximale Größe eines einzelnen Pergamentbogens begrenzt. Pergament lässt sich nicht gut reißen, quillt in Wasser langsamer auf als Papier und ist für Buchdruck und -bindung ungeeignet. Dennoch werden einzelne Pergamentrollen mit einem in sich abgeschlossenen Text auch oft als Buch bezeichnet.\n\n Anders als Pergament ist Papier für die Herstellung von gebundenen Büchern geeignet und lässt sich ausgezeichnet bedrucken. Für Papier werden Lumpen oder Pflanzenfasern, z.B. Reisstroh oder Hanffasern , zerkleinert, in Wasser eingeweicht und zu einem Brei gestampft.",
      "PARFUEM_DESCRIPTION": "Um den Geruch von Straßenstaub loszuwerden oder aus der Menge herauszustechen, benutzen Bürger wie Edelleute beiderlei Geschlechts vom Bornland bis Al’Anfa Parfüme. Diese Duftwässerchen auf alkoholischer Basis decken eine große Bandbreite an Wohlgerüchen ab, vorwiegend nach Blumen, Kräutern und anderen Gewürzen, aber es gibt auch Duftstoffe tierischer Herkunft wie Honig oder Ambra. Parfüms werden auf die Haut getupft oder auf ein Tuch oder Kleidungstück geträufelt, um den Träger für längere Zeit in eine Wolke Wohlgeruchs einzuhüllen.\n\n Das Zentrum der Parfümproduktion ist die Stadt Belhanka im Horasreich, aber überall, wo die Kirche der Göttin Rahja einflussreich ist, werden Parfüme hergestellt. Denn Duftwasser ist eine beliebte Opfergabe an die Kirche und viele Rahjageweihte tragen Parfüm oder aromatisieren damit das Innere des Tempels. Duftwasser ist kein reiner Luxusartikel, doch die besten und berühmtesten Parfüms kann sich nicht jeder leisten. In eine vollständige horasische Kosmetiksammlung gehören die Parfüms Kanäle von Grangor N° 5, 1001 Rausch und das Rosenparfüm Rahjanissimo, in den Tulamidenlanden das nach Zimt duftende Prinzessin Nedime oder Farahmar, in Aranien Mhaharani mit betörender Jasminnote und in Al’Anfa Geranium oder Tiki, das wie ein ganzer Dschungel riechen soll.",
      "PFANNE_DESCRIPTION": "Keine Beschreibung",
      "PFEFFER_DESCRIPTION": "Keine Beschreibung",
      "PFEIL_DESCRIPTION": "Pfeil für Bögen",
      "PHIOLE_DESCRIPTION": "Phiolen sind kleine Fläschchen mit einem mehr oder weniger stark ausgeprägten Bauch und einem schmalen Hals, die vorwiegend von Alchimisten verwendet werden. In Phiolen werden hilfreiche Tränke, Gifte, alchimistische Zutaten, Parfüms und Öle gelagert. Einige sind winzig und fassen kaum einen einzelnen Schluck, andere dagegen sind schon fast eine richtige Flasche.\n\n Es gibt Phiolen aus Ton und Glas, wobei Letzteres von Alchimisten oft bevorzugt wird, da die Farbe des Inhalts weiterhin zu sehen ist. Besonders mit Tränken als Füllung finden Phiolen immer wieder einen Weg in das Gepäck Reisender, die häufig außerordentlich besorgt sind, das kleine Glasgefäß könne Schaden nehmen. Tatsächlich haben Phiolen relativ dicke Wände und überstehen einen Sturz üblicherweise unbeschadet oder mit leichten Rissen, die es ermöglichen, den Inhalt noch zu trinken oder umzufüllen, bevor die Phiole zerbricht. Gezielt auf Stein oder einen Marmorfußboden geschleudert, zerbrechen sie jedoch.\n\n Alchimistische Phiolen werden mit einem Stopfen aus Holz oder Kork verschlossen, prächtige Zierphiolen für beispielsweise Parfüm haben einen Glasstopfen, der oft mit ähnlichen Verzierungen versehen ist wie das dazugehörige Gefäß.",
      "PINSEL_DESCRIPTION": "Keine Beschreibung",
      "PROVIANT_1_TAG_DESCRIPTION": "Äpfel, Birnen, Hammelkeule – die Liste der Nahrungsmittel, die aventurische Helden mit auf Reisen nehmen, ist lang. Es will gut überlegt sein, was man sich zur Verpflegung einpackt, denn je nach Klima des Reiseziels oder Dauer des Abenteuers werden gerade die beliebtesten Happen schnell schlecht und entwickeln ein Eigenleben.\n\n Gut geeignet ist stets, was nicht so bald verdirbt, nur wenig Platz einnimmt und trotzdem sättigt. Trockenfleisch sowie getrocknete Früchte aller Art, sind eine gute Wahl, damit der Reisende nicht dauerhaft in der Wildnis suchen oder seine Reisekasse in einer Taverne anbrechen muss.\n\n Fischhändler schwören zudem darauf, dass in Salz eingelegter Fisch viele Tage hält, ohne faul zu werden. Zweifach gebackenes Brot ist ebenfalls sehr resistent gegen den Pelz Mishkaras und bietet eine gute Beigabe zum Trockenfleisch oder eignet sich zum Andicken einer frischen Suppe.\n\n Da sich viele Abenteurer auch selbst etwas kochen und nicht nur vom eingelegten Proviant essen wollen, nehmen viele Helden auch Gewürze und Kräuter mit. Salz, Zucker, Koriander, sogar Honig und exotische Pulver werden gerne eingekauft und mitgeführt, um einem Braten, einer Suppe oder anderen Gerichten den letzten Schliff zu verleihen.\n\n Doch nicht nur für Speis muss gut gesorgt sein, auch in Sachen Trank sollte der Abenteurer vorgesorgt haben. Hat man nicht gerade Feldflasche oder Wasserschlauch zur Hand, kochen sich viele Aventurier mit Kräutern versetztes Wasser auf, um ihren Durst zu stillen oder dem einen oder anderen Zipperlein Linderung zu verschaffen. Ansonsten sind Wein und Wasser lang haltbare Durstlöscher.",
      "PUDERDOESCHEN_DESCRIPTION": "Keine Beschreibung",
      "PUDER_DESCRIPTION": "Keine Beschreibung",
      "PURPUBLITZ_DESCRIPTION": "Ein tödliches Einnahmegift (Stufe 28).",
      "PURPUSWASSER_DESCRIPTION": "Der Trinkende kann 1 Stunde lang unter Wasser atmen und hält dem Wasserdruck stand.",
      "QUADRANT_DESCRIPTION": "Nur wenige Auserwählte wissen um die Geheimnisse, die am fernen Himmel über Dere kreisen. Doch hat sich so manche Erkenntnis eines Astrologen auch in die Köpfe der aventurischen Allgemeinheit geschlichen, sodass ein Apparat wie der Quadrant nicht mehr nur ein Dasein in Magierlaboren und Sternwarten fristet, sondern sich auf vielen Reisen zum unverzichtbaren Gefährten gemausert hat.\n\n Der Quadrant ist ein Winkelmesser, meist aus Holz, Messing oder ähnlichen Metallen. Er bildet einen Viertelkreis, an dem nebst Peilvorrichtungen ein bewegliches Lot befestigt ist.\n\n Besonders in Brabak wird der Quadrant oft hergestellt, da er dort zur magischen Praxis in den Magierakademie verwendet wird. Den größten Handel mit Quadranten findet man jedoch in Vinsalt. Hier steht die bekannteste Werkstatt zur Anfertigung astrologisch wertvoller Gerätschaften unter der Führung des Obermechanikus Leuerich Kolrean, von der aus in alle Länder Aventuriens geliefert wird. Werkzeuge aus Kolreans Sternenschmiede gelten schon seit einigen Jahren als hohes Statussymbol und glänzen durch unübertroffene Qualität. Sogar Adlige lassen sich zum Kauf eines solchen Werkzeugs verleiten, und sei es nur aus Prestigegründen.\n\n In der Sternenkunde findet der Quadrant Anwendung, um Höhe und Position des Sonnen- und Sternenstands zu bestimmen. Durch Berechnung weiß der Astrologe etwa, wie weit ein bestimmter Stern von einem anderen entfernt liegt oder wie nah ein Himmelskörper zu Dere ist. Den meisten Aventuriern bleibt es ein großes Rätsel, wie der Quadrant genau funktioniert, denn unverständlich ist ihnen, wie man so viel Weisheit aus einem so simplen Gegenstand ziehen kann. Viele meinen gar, es wäre eine besondere Art von Hellseherei im Spiel, wenn mit Hilfe des Quadranten ein anstehender Sternenschnuppenflug vorausgesagt wird. Manch einer glaubt dagegen auch, es wäre bloß ein Gerät, welches sich gut in der Hand eines Redners macht, um seiner Philosophie über die Geschehnisse außerhalb Deres mehr Ausdruck zu verleihen.\n\n Allerdings erfreut sich der Quadrant großer Beliebtheit bei Seefahrern, insbesondere Navigatoren. In der Ausrüstung einer Heldengruppe, die vorhat, die weiten Ozeane zu bereisen, sollte der Quadrant nicht fehlen. Hat der Navigator eine Schulung im Bereich der Sternkunde erfahren, vermag er aus der Position der Himmelskörper und der auf dem Quadranten abgelesenen Winkel, den genauen Standort zu ermitteln und so seinen Kurs auf See zu halten, oder notfalls zu ändern. Hierzu muss er allerdings weitreichende Kenntnisse über den Stand der Sonne und Sterne zu bestimmten Zeiten an bestimmten Orten haben.\n\n Das Messinstrument wird auch gerne in Kombination mit einem Astrolabium verwendet, um noch genauere Messergebnisse zu erhalten.",
      "RING_DESCRIPTION": "\"Ein Ring, sie zu knechten, sie alle zu finden, ins Dunkel zu treiben und ewig zu binden.\"; \"Das ist ein Ehering!\"; \"Sage ich doch.\"",
      "SACKPFEIFE_DESCRIPTION": "Ich habe auch eine Sackpfeife - in meiner Hose!",
      "SACK_DESCRIPTION": "Ein alter Sack.",
      "SAMTHAUCH_DESCRIPTION": "Samthauch, auch Kamaluqs Tatze oder Scharlachkatze genannt, ist ein Rauschmittel, das aus den Blütenblättern des Schleichenden Todes gewonnen wird. In hoher Dosierung kann es auch als tödliches Atemgift verwendet werden. Im Mittelreich steht es auf dem Wehrheimer Index. Preis pro Portion.",
      "SCHAUFEL_DESCRIPTION": "Keine Beschreibung",
      "SCHELLE_DESCRIPTION": "Keine Beschreibung",
      "SCHERE_DESCRIPTION": "Keine Beschreibung",
      "SCHLAFGIFT_DESCRIPTION": "Schlafgift ist ein Betäubungsmittel.",
      "SCHLAFSACK_DESCRIPTION": "Nicht jedem ist es recht, in der Wildnis auf rauem Boden zu nächtigen. So mancher bevorzugt neben Wolldecke und Zelt einen warmen, gemütlichen Schlafsack. Man munkelt, dass reisende Geweihte des Aves die ersten Schlafsäcke hergestellt und unter die Leute gebracht haben.\n\n Die ersten und primitiveren Schlafsäcke sollen noch aus Flicken und dicken Stoffen bestanden haben. Heutzutage findet man immer häufiger Schlafsäcke aus mit Schafswolle gefüttertem Leder. Auch hört man Geschichten von armen Wandersleuten, die in leeren Jute- und Kartoffelsäcken übernachtet haben sollen.\n\n Der Schlafsack umhüllt den Körper mit Ausnahme des Kopfes komplett und wärmt so von allen Seiten. Er ist ringsum vernäht, sodass man vom Kopfende aus hineinschlüpfen muss, an dem sich kapuzengleich ein weiteres Stück Stoff befindet, in welches man den Kopf einhüllen kann. Für bessere Bequemlichkeit lässt sich das Kopfstück eingerollt als Stützkissen nutzen.\n\n Geschickt gefaltet und gerollt lässt sich der Schlafsack ohne Schwierigkeit auf langen Reisen transportieren, etwa unter den Arm geklemmt, durch einen Riemen am Rucksack befestigt oder an einen Sattel geknüpft.",
      "SCHMIEDEHAMMER_DESCRIPTION": "Auch wenn der Schmiedehammer schon bei der näheren Betrachtung wie eine Waffe wirkt, ist er doch in erster Linie ein ingerimmgefälliges Werkzeug. Das Arbeitsinstrument der aventurischen Schmiede ist dazu gedacht, auf heißen Stahl zu schlagen und ihm so seine Form zu geben. Der Herstellungsprozess des Schmiedens setzt einiges an Kraft voraus und durch den schweren Kopf des Hammers kann die Kraft des Schmiedes sogar noch besser genutzt wurden. Der wuchtige Schmiedehammer ist keine Waffe für raffinierte Angriffe. Täuschungsmanöver lassen sich mit ihm nur sehr schwer ausführen, da die Waffe sehr kopflastig ist. Aus dem gleichen Grund ist das Verteidigen mit einem Schmiedehammer schwierig, was ihn für Paraden nicht gerade zu einer idealen Waffe macht.",
      "SCHMUCKKAESTCHEN_DESCRIPTION": "Keine Beschreibung",
      "SCHNAPS_DESCRIPTION": "Keine Beschreibung",
      "SCHNEESCHUHE_DESCRIPTION": "Für einen Firnelfen ist es wahrscheinlich ein großer Spaß, über die Schneeschuhe der Nivesen- und Norbardensippen zu witzeln. Jedoch gleiten diese filigranen Bewohner der mit Eis bedeckten Länder Aventuriens auf diese Weise über den Schnee hinweg, wohingegen andere Völker sich mühsam an der weißen Masse abstrampeln.\n\n In den Nivesenlanden sind Schneeschuhe weit verbreitet und die menschlichen Siedler nutzen sie täglich, um Schnee und Eis zu trotzen. Dort werden auch gerne Skier verwendet, welche sich jedoch aufgrund der hohen Verletzungsgefahr nicht im Großteil Aventuriens durchgesetzt haben.\n\n Die aus Bast und Holz geflochtenen Schneeschuhe werden über den, in der Kälte unverzichtbaren, gefütterten Stiefel getragen. Durch die breitere Trittfläche, das Korbgeflecht, das unten am Schuh anliegt, erlangt man im Schneegestöber und tiefem Pulverschnee einen sicheren Stand und vermag sich deutlich schneller fortzubewegen. Nicht selten wird auch ein Schneetreiber, eine weitere Korbgeflechtschiene, die vor dem Schuh einen breiten und hohen Rand bildet, an den Schneeschuhen angebracht. Dadurch kann man sich auf flachem Untergrund schlurfend durch das Eis bewegen und für Reisegefährten oder Reittiere eine Schneise schlagen.",
      "SCHNUR_10_SCHRITT_DESCRIPTION": "Keine Beschreibung",
      "SCHOKOLADE_DESCRIPTION": "Keine Beschreibung",
      "SCHROEPFGLAS_DESCRIPTION": "Keine Beschreibung",
      "SCHWADENBEUTEL_DESCRIPTION": "Der Inhalt des Beutels erfüllt das Gebiet im Radius von 1 Schritt mit dichtem Rauch, der sich nach einigen Minuten wieder verzieht. Mit einer gelungenen Fingerfertigkeits-Probe (16) lässt sich der Inhalt in eine bestimmte Richtung sprühen.",
      "SCHWAMM_DESCRIPTION": "Keine Beschreibung",
      "SEIFE_DESCRIPTION": "Seife wird in ganz Aventurien geschätzt, um den Schmutz von Arbeit und Straße von Körper und Kleidung zu entfernen. Sie ist ein leicht herzustellendes Produkt, das selbst in abgelegenen Ortschaften zu bekommen ist und in kaum einem Reisegepäck fehlt. Es gibt sie in edel, parfümiert und mit Blüten versetzt ebenso wie in sehr einfach mit groben Klümpchen zu kaufen, je nach Geldbeutel.\n\n Seifen lassen sich recht gut in Form schnitzen und teilweise werden edle Sorten in bestimmte Formen, z. B. Blumenblüten, geschnitten verkauft. Seifen müssen bei der Herstellung nach dem Sieden getrocknet werden und nehmen Wasser ausgesetzt wieder eine weiche Konsistenz an. Findige Phexgeweihte, Agenten und Schmuggler nutzen Seife gerne, um darin Nachrichten im Inneren eines aufgeschnittenen und dann mit etwas Wasser wieder zusammengeklebten Stücks zu schmuggeln. Auch um Abdrücke von Schlüsseln oder Siegelringen zu machen, um diese genauer nachmachen zu können, ist Seife sehr beliebt. Gerüchten zufolge ist ein Stück Seife in einem Tuch oder einer Socke auch als unangenehme, nicht tödliche Waffe nutzbar.",
      "SENSE_DESCRIPTION": "Keine Beschreibung",
      "SICHEL_DESCRIPTION": "Die Sichel ist ein Werkzeug zur Feldarbeit. Im Gegensatz zur Sense, die für gröbere Feldarbeit gedacht ist, kann man mit der Sichel zarte Kräuter und einzelne Halme abschneiden. Obwohl die Sichel als Werkzeug entworfen wurde, kann man sie auch als Waffe verwenden. Durch die gebogene, scharfe Klinge ist sie bei Hiebangriffen gefährlich genug, um üble Wunden zu reißen. Zur Verteidigung eignet sie sich allerdings nicht besonders. Die Sichel ist zu kurz und ihre gebogene Form bietet kaum Möglichkeiten, eine gegnerische Waffe zu parieren oder die Wucht eines Schlags abzulenken. Auch wenn man annehmen könnte, dass die gebogene Klinge ideal wäre, um den Feind zu entwaffnen, indem man dessen Waffe mit der Sichel verhakt, so ist dieses Manöver mit der gebogenen Klinge nicht leichter auszuführen als mit fast jeder anderen Waffe.",
      "SIEGELWACHS_DESCRIPTION": "Keine Beschreibung",
      "SIGNALHORN_DESCRIPTION": "Keine Beschreibung",
      "SPATEN_DESCRIPTION": "Ein stabiler Spaten und eine ebensolche Spitzhacke gehören zur Ausstattung eines jeden Schatzsuchers, Forschers, Bergmanns oder Grabräubers. Mit ihnen lassen sich verschüttete Ruinen ausgraben, edle Erze und Steine aus dem Gestein lösen, steinerne und andere Türen aufbrechen und Höhlen erkunden. Daneben sind sie auch in der Landwirtschaft nützlich, besonders der Spaten, der natürlich auch verwendet wird, um die traurige Aufgabe zu erfüllen, ein Grab zu schaufeln.\n\n Beide Werkzeuge sind etwas sperrig, aber bei einer archäologischen Expedition unabdingbar. Immerhin brauchen sie nicht großartig vor Wind und Wetter geschützt zu werden, sondern lassen sich einfach so mit im Reisegepäck unterbringen.\n\n Beide geben im Notfall eine passable improvisierte Waffe ab, wobei die Spitzhacke deutlich stabiler und vor allem gefährlicher ist. Es wurde schon mehr als ein Grabräuber oder leichtgläubiger Entdecker mit einer Spitzhacke von neidischen Mitreisenden hinterrücks erschlagen.",
      "SPIELKARTEN_DESCRIPTION": "Keine Beschreibung",
      "SPIELUHR_DESCRIPTION": "Keine Beschreibung",
      "SPINETT_DESCRIPTION": "Keine Beschreibung",
      "STANDHARFE_DESCRIPTION": "Keine Beschreibung",
      "STECKENPFERD_DESCRIPTION": "Keine Beschreibung",
      "STIRNREIF_DESCRIPTION": "Keine Beschreibung",
      "STOFFPUPPE_DESCRIPTION": "Keine Beschreibung",
      "STORCHENMASKE_DESCRIPTION": "Keine Beschreibung",
      "STRICKLEITER_10_SCHRITT_DESCRIPTION": "Wem ein Kletterseil nicht reicht, oder wer nicht genug Halt daran findet, der greift sich direkt zwei Exemplare davon und verbindet sie mit mehreren Tritthölzern oder Seilstücken und macht sich daraus eine simple Strickleiter. Meist sind sie zwischen fünf und sechs Schritt lang. Ebenso leicht wie das Kletterseil lässt sich eine Strickleiter aufrollen und im Reisegepäck unterbringen.\n\n Zwar dauert das Aufhängen einer Strickleiter im Schnitt deutlich länger als der Gebrauch des Kletterseils, doch kann es sich für eine große Reisegesellschaft lohnen, einen deutlich leichteren Auf- und Abstieg zu haben. Der Aufwand des Bauens und Aufhängens einer Strickleiter wird für viele durch den schnellen und deutlich sichereren Ablauf beim Klettern in den Hintergrund gedrängt. Außer auf Reisen findet sich die Strickleiter auf vielen Höfen und in Scheunen. Dort wird sie genutzt, um die Dachkammern und Strohlager zu erreichen, da eine massive Treppe meist zu viel Stauraum stehlen würde. Auch als Kinderspiel erfreut sich diese Leiter großer Beliebtheit. An einen Ast gebunden, hängen sich Kinder an die im Wind schaukelnde Leiter und versuchen sich so lange festzuhalten, bis sie herunterfallen. Wenn mehrere Kinder an dem Spiel beteiligt sind, versuchen sie sich gerne gegenseitig herunterzustoßen, oder schwingen nacheinander, um zu sehen, wer sich länger halten konnte. Die Strickleiter ist vor allem im Mittelreich sehr verbreitet.",
      "STUNDENGLAS_DESCRIPTION": "Das Stundenglas wird auch als Sanduhr bezeichnet und ist überall dort verbreitet, wo Zeitmessung von Bedeutung ist. Dabei gibt es keine Uhrzeit an, sondern benö- tigt eine festgelegte Zeit, um komplett durchzulaufen. Wie lang diese Spanne ist, hängt von der Größe des Stundenglases ab. Das am weitesten verbreitete ist etwa so hoch wie eine Hand und misst eine halbe Stunde. Es gibt schlichte Sanduhren, die sich gut eingepackt mit auf Reisen nehmen lassen, und kunstvoll verzierte, die mit farbigem oder von weit entfernten Stränden stammendem Sand gefüllt sind.\n\n Stundengläser gibt es in allen größeren Städten zu kaufen, besonders dort, wo Gelehrsamkeit einen hohen Stellenwert hat oder es einen Seehafen gibt. Denn Stundengläser messen die Zeit nicht nur in Tempeln, Gelehrtenstuben, Magierakademien und anderen Lehreinrichtungen, sondern auch auf Segelschiffen. Dort sorgen sie dafür, dass die Wach- und Dienstzeiten der Seeleute immer dieselbe Länge haben.\n\n Symbolisch werden Stundengläser sowohl mit Praios als auch mit Boron in Verbindung gebracht. Einige Praiosgeweihte widmen sich der Zeitmessung als einem Aspekt der Ordnung ihres Gottes, ein paar von ihnen helfen als beratenden Spezialisten bei der Herstellung von Stundengläsern.\n\n Mit Boron wird die Sanduhr in Verbindung gebracht als Zeichen für die Vergänglichkeit des Lebens. Besonders in den Tulamidenlanden und im Süden symbolisiert Borons sanfte Tochter Marbo die Vergänglichkeit.",
      "TABAKDOSE_DESCRIPTION": "Keine Beschreibung",
      "TABAKPFEIFE_DESCRIPTION": "Keine Beschreibung",
      "TABAK_DESCRIPTION": "Keine Beschreibung",
      "TAETOWIERWERKZEUG_DESCRIPTION": "Keine Beschreibung",
      "TAGEBUCH_DESCRIPTION": "\"Liebes Tagebuch, was ich Dir nun anvertraue ist für niemanden sonst bestimmt…\" Du hörst auf zu lesen, da Du Respekt vor der Privatsphäre anderer hast.",
      "TASCHENTUCH_DESCRIPTION": "Keine Beschreibung",
      "TASCHENUHR_VINSALTER_EI_DESCRIPTION": "Das Vinsalter Ei ist eine relativ neue Erfindung aus dem Horasreich, deren Besitz in den meisten Regionen Aventuriens großes Erstaunen oder Neid hervorrufen wird. Denn bei dem Vinsalter Ei handelt es sich um eine Taschenuhr.\n\n Uhren sind im Lieblichen Feld wahrhaft kein ungewöhnlicher Anblick, viele Städte haben einen eigenen Uhrturm, in dem eine ausgeklügelte Mechanik dafür sorgt, dass die Zeit angezeigt wird und in bestimmten Abständen Glockenspiele läuten. Auch in vielen Palazzi und Bürgerhäusern zeigen Standuhren die Zeit an. Taschenuhren dagegen haben einen gewissen Seltenheitswert, denn sie sind zwar keine unbezahlbare, aber durchaus teure Anschaffung. Aufgrund ihres Preises und des Schmuckcharakters sind Taschenuhren Prestigeobjekte, neben ihrem unbestreitbar praktischen Nutzen, selbst in dunkelster Nacht präzise die Zeit anzuzeigen. Dazu sind sie etwas empfindlich gegenüber Sand und anderem Dreck. Wenn dieser in die Mechanik im Inneren gerät, bleibt die Uhr stehen und muss von einem Experten gereinigt werden.\n\n Vinsalter Eier sind so groß beziehungsweise klein, dass sie auf dem Handteller eines Erwachsenen liegen können. Meistens haben sie die Form eines Eis, sie können aber auch oval oder rund sein. Sie haben ein Gehäuse aus Metall, oft Messing, das die sensible Mechanik und das Zifferblatt vor Dreck schützt. Letzteres verbirgt sich unter einem aufklappbaren Deckel und ist oft kunstvoll bemalt. Das Uhrwerk befindet sich im Inneren der Taschenuhr, ein mechanisches Meisterwerk, dessen Herstellung nur den geschicktesten Handwerkern gelingt und großes Können erfordert. Die vielen kleinen Teile werden einzeln gefertigt und dann sorgfältig zusammengesetzt.\n\n Jede Taschenuhr ist nicht nur eine mechanischen Leistung, sondern auch ein kleines Kunstwerk. Denn das Gehäuse wird mit Edelmetallen, Gravuren und Steinen verziert, gegen einen geringen Aufpreis wird die Verzierung nach Kundenwunsch gestaltet. Besonders Familienwappen und Wahlsprüche sind dabei sehr beliebt. Die meisten haben außen am Gehäuse einen Ring, durch den sich eine Uhrkette ziehen lässt. Diese hilft, das Vinsalter Ei am Gürtel, dem Wams oder um den Hals zu befestigen und wird häufig optisch passend zur Uhr gemeinsam mit dieser verkauft.\n\n Vinsalter Eier wurden vor rund 50 Jahren vom Vinsalter Uhrmacher Zechin Olivari erfunden, der Betrieb dieser Familie fertigt nach wie vor Uhren jeder Größe. Die berühmtesten Taschenuhren im Lieblichen Feld stammen mittlerweile jedoch aus der Stadt Aldyra, die im ganzen Land für ihre meisterhaften Mechaniker bekannt ist. Mit Händlern und anderen Reisenden verlassen immer wieder Taschenuhren das Horasreich, so dass diese auch in anderen Regionen bekannt und auf Märkten angeboten werden. Allerdings kosten sie deutlich mehr Geld, je weiter der Herstellungsort entfernt ist.",
      "TIEGEL_DESCRIPTION": "Keine Beschreibung",
      "TINTENFAESSCHEN_DESCRIPTION": "Keine Beschreibung",
      "TINTE_DESCRIPTION": "Keine Beschreibung",
      "TRAUMKRAUT_DESCRIPTION": "Keine Beschreibung. Preis pro Portion",
      "TRINKHORN_DESCRIPTION": "Keine Beschreibung",
      "TROMMEL_DESCRIPTION": "Keine Beschreibung",
      "TRUHE_DESCRIPTION": "Keine Beschreibung",
      "TUCHBEUTEL_DESCRIPTION": "Keine Beschreibung",
      "UMHAENGETASCHE_DESCRIPTION": "Keine Beschreibung",
      "UNSICHTBARKEITSELEXIER_DESCRIPTION": "Der Trinkende wird für 1 Stunde unsichtbar, Kleidung und andere Gegenstände sind nicht betroffen.",
      "UNVERWUNDBARKEITSTRANK_DESCRIPTION": "Der RS steigt für 1 Stunde um +1.",
      "VASE_DESCRIPTION": "Keine Beschreibung",
      "VERBAND_10_STUECK_DESCRIPTION": "Verbandszeug darf auf keiner Reise fehlen, egal wohin und mit welchem Fortbewegungsmittel. Einfaches Verbandszeug umfasst einige Stoffverbände, Nadel und Faden zum Nähen einer Wunde, eine Pinzette und ein scharfes Schneidwerkzeug. Am besten wäre ein Skalpell, genutzt wird hier bei schlechter Ausstattung des Heilers häufig ein Messer.\n\n Eine bessere Ausrüstung enthält mindestens ein Skalpell, ein Spreizwerkzeug und einen Spatel, dazu kommen oft eine Knochensäge und eine Schere zum Zertrennen der Kleidung neben der Wunde. Auch eine Auswahl schmerz- und blutungsstillender Kräuter und Pulver oder flüssige Tinkturen zum Reinigen oder Behandeln einer Verletzung dürfen nicht fehlen. Ergänzt wird alles durch starken Schnaps, einige mehr oder weniger wirksame Hausmittel und ein paar Glücksbringer, die meistens reiner Aberglaube sind.\n\n Verbandszeug ist relativ einfach zu bekommen, besonders wenn es nur darum geht, die Stoffverbände zu ersetzen. Diese lassen sich in der Not auch recht einfach improvisieren.\n\n Das beste Verbandszeug lässt sich immer in Städten mit einem großen Perainetempel kaufen, ist die Heilkunst doch eine der höchsten Pflichten der Geweihten der Göttin.",
      "VERWANDLUNGSELEXIER_DESCRIPTION": "Der Trinkende verwandelt sich für 1 Stunde in ein Kleintier (abhängig von der Herstellung).",
      "VORHAENGESCHLOSS_DESCRIPTION": "Wo die meisten Schlösser in das zu verschließende Objekt wie eine Tür oder Truhe fest eingebaut werden, ist das Vorhängeschloss unabhängig davon. Es kann ganz nach Bedarf zum Abschließen verwendet und mitgeführt werden, falls es unterwegs eine Truhe, einen Schrank oder ein Tor zu verschließen gilt. Manch ein angehender Einbrecher besitzt auch ein Vorhängeschloss zu Übungszwecken.\n\n Vorhängeschlösser werden in unterschiedlichen Grö- ßen und aus unterschiedlichem Metall gefertigt. Zierende Ausfertigungen aus Gold und Silber sollen Schmuckschatullen oder hin und wieder auch Keuschheitsgürtel verschließen, während eine Geldtruhe oder ein Kerker ein möglichst großes, komplex aussehendes Exemplar benötigt, wenn es nicht ohnehin ein fest verbautes Schloss gibt.\n\n Besonders abschreckende Exemplare haben ebenso wie andere Schlösser versteckte Dornen, die beim Öffnen ohne Schlüssel hervorspringen und den Dieb in die Hand stechen. Von besonders skrupellosen Gestalten werden diese Dornen sogar noch vergiftet. Diebe fürchten diese Schlösser ähnlich wie besonders stark verrostete Vorhängeschlösser, die einem Dietrich widerstehen.\n\n Vorhängeschlösser sind weit verbreitet und in allen großen Städten zu kaufen, besonders im Horasreich kann man hier, wie bei vielen anderen Feinmechaniken auch, außerordentlich gute Qualität bekommen. Die besten Exemplare werden jedoch von Zwergen hergestellt, die als Erfinder der Mechanik aller Schlösser gelten.",
      "VORSCHLAGHAMMER_DESCRIPTION": "Keine Beschreibung",
      "WAFFENBALSAM_DESCRIPTION": "Die Waffe gilt für 1 Tag als magisch, ihre Härte steigt um +2.",
      "WASSERPFEIFFE_DESCRIPTION": "Zu dem Bild, das viele Aventurier von den Tulamidenlanden haben, gehört dazu, dass dort auf Kissen sitzend oder liegend Wasserpfeife geraucht wird. Tatsächlich entspricht dieses Klischee weitestgehend der Wahrheit, denn Wasserpfeifen lassen sich in den Tulamidenlanden und Aranien in jedem Teehaus, jeder Herberge und jeder Karawanserei bestellen oder auf jedem Markt kaufen, denn der Genuss einer solchen ist für beiderlei Geschlecht fester Bestandteil der tulamidischen Lebensart.\n\n Sie zu rauchen ist auch meistens ein gesellschaftliches Ereignis, bei dem sich Freunde, Geschäftspartner oder auch Feinde eine Pfeife teilen und Konversation betreiben, eine Kleinigkeit essen oder Rote-und-Wei- ße-Kamele spielen. Auch so mancher Sieg wurde im Pfeifenrauch gefeiert und manche bedeutende Beratung fand in einer Teestube bei einer Wasserpfeife statt.\n\n In Wasserpfeifen geraucht wird üblicherweise Tabak, der für den feineren Gaumen, oder um den Tabak zu strecken, auch aromatisiert wird mit den Schalen von Äpfeln, Orangen oder getrockneten Blüten und Früchten.",
      "WASSERSCHLAUCH_DESCRIPTION": "Ähnlich wie die Feldflasche ist auch der unförmige Wasserschlauch zum Transport von Flüssigkeiten auf langen Reisen gedacht. Anders jedoch als diese, von der meist jeder Abenteurer seine eigene mit sich führt, ist der Wasserschlauch dazu geeignet, große Mengen an Wasser, Bier oder Wein zu tragen. Aufgrund ihrer Größe sind Wasserschläuche aus Leder unheimlich teuer, weshalb sie meist aus Tierdärmen und -mägen, etwa von Kühen oder Schafen, genäht werden. Sie haben jeweils einen großen bauchigen Füllraum und einen schlauchförmigen Ansatz, der dem Wasserschlauch seinen Namen gibt. Über diesen Schlauch sind sie befüllbar und lassen sich praktisch an jeden Zapfhahn anschließen.\n\n Am leichtesten fällt der Transport der mehrere Maß fassenden Schläuche, wenn man zwei etwa gleich voll gefüllte Wasserschläuche an den Ansätzen verknotet und über ein Joch, einen langen hölzernen Stecken, gehangen trägt.\n\n Nur selten sieht man den einzelnen Wasserschlauch, der mit einem Pfropf aus Kork oder Wachs versiegelt ist. Das Verschließen fällt bei ihm schwerer, da der Schlauch keine feste Form behält, dafür ist man aber auch nicht gezwungen, zwei Schläuche zu tragen und kann einiges an Gewicht einsparen.",
      "WEIN_DESCRIPTION": "Keine Beschreibung",
      "WILLENSTRUNK_DESCRIPTION": "Erhöht die MR für 1 Stunde um +4.",
      "WOLFSFELL_DESCRIPTION": "Keine Beschreibung",
      "WOLLDECKE_DESCRIPTION": "Grobe und feine Wolle – nichts wärmt besser als das überschüssige Fell von Schaf und Ziege. Die meisten handelsüblichen Wolldecken sind groß genug, dass sich der Durchschnittsaventurier komplett darin einhüllen kann. Aber auch kleinere Decken sind gerne gesehen, etwa als Hausschmuck oder Sitzteppich. Je nach Qualität und Dicke der verwendeten Wolle kommt die Decke sehr günstig oder unheimlich teuer über die Markttheke. Wer sich dennoch keine leisten kann, greift auch gern zu Tuch um sich einzuhüllen, oder macht sich eine Decke aus Flicken. Gerade in kühleren Gebieten Aventuriens besitzt jeder, nicht bloß zur Reiseausstattung, eine oder mehrere Wolldecken. Dagegen sollen oft Bewohner wärmerer Gegenden darüber spotten, weshalb man einen dickpelzigen Teppich mit sich herum schleppen sollte.\n\n Auf Reisen ist aber jeder dankbar, wenn er auf weicherem Untergrund als dem kühlen Waldboden oder dem stechenden Stroh im Stall nächtigen oder sich in der Kälte der Nacht zudecken kann. Eine Wolldecke hat schon so manchen Aventurier vor dem Kältetod bewahrt und bei den Fjarningern ist eine Frau mit einer guten und warmen Wolldecke reicher als ein Mann mit 5 Stein Gold. Die besten Wolldecken werden auf den Zyklopeninseln angefertigt. Hier verwendet man gerne die Wolle des Phraischafs, das für eine besonders gute Qualität bekannt ist. Es schützt auch deutlich besser vor der Kälte, aber es ist auch empfindlicher als einfache Wolle.",
      "WUERFEL_DESCRIPTION": "Reisende Abenteurer nutzen sie ebenso gern wie gelangweilte Adlige und gerissene Streuner: Würfel. Die meisten Würfel haben sechs Seiten, doch einige Aventurier besitzen Zwanzigseitige. Mystiker sollen auch Exemplare mit zwölf Seiten für Orakelwürfe nutzen.\n\n Es gibt eine Unzahl an Würfelspielen mit einem oder mehreren Würfeln, die darauf abzielen, eine möglichst hohe Gesamtzahl zu würfeln oder eine vorher bestimmte Zielsumme zu erreichen. Die Spiele tragen Namen wie „Gareth brennt“ oder „21 Kreuzer“ und drehen sich meistens darum, Geld zu gewinnen oder wenigstens zu klären, wer die nächste Runde Getränke bezahlen muss. Aus diesem Grund unternehmen viele immer wieder Versuche, das Ergebnis weniger Glück und Zufall zu überlassen. Die harmlosen Varianten davon sind Glücksbringer, Stoßgebete an Phex und eine „unschlagbare“ Würfeltechnik. Um jedoch wirklich sicher zu sein, dass die Würfel zu den eigenen Gunsten fallen, werden diese gezinkt, indem sie ungleichmäßig schwer sind, an den entscheidenden Stellen abgeflachte Kanten haben oder sogar kleine Mengen Blei eingearbeitet bekommen.",
      "WUNDNAEHZEUG_DESCRIPTION": "Keine Beschreibung",
      "WURFHAKEN_DESCRIPTION": "Anders als der Kletterhaken besitzt der Wurfhaken drei bis fünf lange gebogene Stahlstreben. Er wird am Ende eines Seils angebracht und mit viel Schwung auf eine Anhöhe geschleudert. Um ein Seil für einen Bergstieg zu befestigen, eignet sich dieser Haken besonders gut, wenn sich genug Klemmfläche finden lässt, denn der Haken nützt nichts, wenn er sich nirgends festzukrallen vermag. Hat sich der Haken dann gut verkeilt, sollte man vor dem Aufstieg kräftig an dem Seil ziehen, um sich zu vergewissern, dass es auch sicher ist und sich beim Kletterversuch nicht lösen kann. Gerade wenn mehrere Personen gleichzeitig oder nacheinander zu klettern beabsichtigen, sollten das Seil und der Haken mehrfach geprüft werden.\n\n Er gehört somit zur Standardausrüstung jedes Gebirgswanderers. Aber auch jeder Fassadenkletterer, der etwas auf sich hält, wird einen Wurfhaken im Gepäck haben.\n\n Manchmal wurde der Wurfhaken an einem Seil auch als improvisierte Waffe missbraucht. Man kann den Haken schwingen und versuchen, seinen Gegner mit einem gezielten Treffer zu erwischen. Allerdings gehört viel Übung dazu und es kann ähnlich viel dabei schiefgehen wie mit einem Morgenstern.",
      "ZANGE_DESCRIPTION": "Keine Beschreibung",
      "ZAUBERTRANK_DESCRIPTION": "Regeneriert sofort 2W6 Astralpunkte.",
      "ZELT_DESCRIPTION": "Die meisten Abenteurerzelte sind aus Stoffflicken, alten Wolldecken und Lederstücken gefertigt. Nur wohlhabendere Helden oder Nomadenvölker, die sich selbst Zelte fertigen können, werden ein aus einheitlichen Stücken bestehendes Zelt besitzen.\n\n Unter Gläubigen der Zwölfgötter gilt das Reisezelt als eine von Aves’ Gaben. Es soll dafür sorgen, dass man auch im provisorisch aufgeschlagenen Lager die Vorteile von Haus und Hof genießen kann. Es fällt so sogar strengen Glaubensanhängern Travias leichter, sich für eine Reise zu rüsten, da sie das Zelt als transportable Erweiterung ihres eigenen Heims verstehen können. Für einen traviagefälligen Abenteurer gilt es daher, die Gesetze seiner Kirche am Lagerplatz und im Zelt ebenso zu wahren, als auch anderen Reisegefährten nahezubringen.\n\n Ein Zelt kann an Bäumen aufgehängt und am Boden verankert werden. Durch angespitzte Pflöcke, genannt Heringe, aus Holz oder Stahl, kann das Zelt auf weichem Boden aufgebaut werden.",
      "ZIELWASSER_DESCRIPTION": "Für 1 Stunde sind alle Fernkampfangriffe um +2 erleichtert.",
      "ZIMMERMANNSKASTEN_DESCRIPTION": "Keine Beschreibung",
      "ZUNDER_DESCRIPTION": "Keine Beschreibung",
      "ZUNDER_DOSE_DESCRIPTION": "Damit der Zunder, der mit Feuerstein und Stahl entzündet wird, auch richtig brennt, muss er trocken gelagert werden. Dazu dienen Zunderdosen, kleine Dosen mit Deckel, die in keinem Rucksack eines Abenteurers fehlen dürfen. Auch in vielen Küchen steht eine, falls das Feuer im Herd neu entfacht werden muss. Die meisten Dosen sind etwa so groß wie ein Handteller, doch es gibt auch größere und kleinere Exemplare. Um möglichst feuchtigkeitsabweisend zu sein, werden sie aus Metall gefertigt und oft noch extra in Wachstuch eingeschlagen. Beliebt sind Bronze und Kupfer, aber prächtige Zunderdosen adliger Entdecker können auch aus Silber mit kunstvollen Verzierungen sein. Tatsächlich sind viele der Dosen relativ dicht und der Zunder darin übersteht auch einen schweren Regenguss oder ein unfreiwilliges Bad ohne sofort breiförmige Konsistenz anzunehmen. Feucht wird er trotzdem, sodass es länger dauert bis er Feuer fängt. Zunderdosen sind nicht nur für Zunder geeignet, in ihnen werden auch Süßigkeiten, Ringe oder geheime Karten transportiert. Hauptsächlich wird darin aber Zunder aufbewahrt, um ihn zum Feuermachen parat zu haben."
    }
};
// === ENDE ÜBERSETZUNGSOBJEKT ===

const FOUNDRY_V12_ITEM_TEMPLATE = {
    "_id": "", // Wird später gesetzt
    "_key": "", // Wird später gesetzt
    "name": "",
    "type": "gegenstand",
    "img": "icons/svg/item-bag.svg",
    "system": {
        "aufbewahrungs_ort": "mitführend",
        "bewahrt_auf": [],
        "gewicht_summe": 0,
        "gewicht": 0,
        "preis": 0,
        "quantity": 1,
        "text": ""
    },
    "effects": [],
    "folder": null,
    "sort": 0,
    "ownership": {
        "default": 0
    },
    "flags": {},
    "_stats": {
        "systemId": null,
        "systemVersion": null,
        "coreVersion": "12.0.0",
        "createdTime": null,
        "modifiedTime": null,
        "lastModifiedBy": null
    }
};

// Funktion zur Generierung einer Foundry-kompatiblen ID (13-16 Zeichen)
function generateFoundryId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Generiere zufällige Länge zwischen 13 und 16 Zeichen
    const length = Math.floor(Math.random() * 4) + 13; // 13, 14, 15 oder 16
    
    // Generiere ausreichend zufällige Bytes
    const bytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        // Sicherstellen, dass der Index innerhalb des bytes-Arrays bleibt
        const byte = bytes[i];
        result += chars[byte % chars.length];
    }
    
    return result;
}

// Funktion zum Normalisieren von Dateinamen (für Foundry-Kompatibilität)
function normalizeFilename(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 50);
}

// Funktion zum Erstellen des Foundry-Dateinamens
function createFoundryFilename(itemName, documentId) {
    const normalizedName = normalizeFilename(itemName);
    return `${normalizedName}_${documentId}`;
}

// Funktion zum Nachschlagen und Übersetzen
function translateItemData(originalItem) {
    const translatedItem = { ...originalItem };

    // 1. NAME übersetzen
    if (translatedItem.name && TRANSLATIONS.COMMON_ITEM[translatedItem.name]) {
        console.log(`   Übersetze Name: "${translatedItem.name}" -> "${TRANSLATIONS.COMMON_ITEM[translatedItem.name]}"`);
        translatedItem.name = TRANSLATIONS.COMMON_ITEM[translatedItem.name];
    }

    // 2. BESCHREIBUNG übersetzen
    if (translatedItem.description) {
        // Direkter Key
        if (TRANSLATIONS.COMMON_ITEM_DESCRIPTION[translatedItem.description]) {
            console.log(`   Übersetze Beschreibung (direkt): "${translatedItem.description}"`);
            translatedItem.description = TRANSLATIONS.COMMON_ITEM_DESCRIPTION[translatedItem.description];
        }
        // Name + "_DESCRIPTION"
        else if (originalItem.name && TRANSLATIONS.COMMON_ITEM_DESCRIPTION[`${originalItem.name}_DESCRIPTION`]) {
            const descriptionKey = `${originalItem.name}_DESCRIPTION`;
            console.log(`   Übersetze Beschreibung (via Name): "${descriptionKey}"`);
            translatedItem.description = TRANSLATIONS.COMMON_ITEM_DESCRIPTION[descriptionKey];
        }
        else {
            console.log(`   Keine Übersetzung für Beschreibung: "${translatedItem.description.substring(0, 30)}..."`);
        }
    }

    return translatedItem;
}

// Mapping-Funktion von (übersetztem) Original zu Foundry V12
function mapToFoundryItem(translatedItem, originalItem, documentId) {
    const foundryItem = JSON.parse(JSON.stringify(FOUNDRY_V12_ITEM_TEMPLATE));
    
    // WICHTIGE FELDER für Foundry V12
    foundryItem._id = documentId;
    foundryItem._key = `!items!${documentId}`; // Foundry _key Format
    foundryItem.name = translatedItem.name || "Unbenannter Gegenstand";
    foundryItem.system.text = translatedItem.description || "";

    // Systemdaten zuordnen mit Gewichtsumrechnung
    foundryItem.system.gewicht = originalItem.weight ? originalItem.weight / 1000 : 0;
    foundryItem.system.preis = originalItem.cost || 0;
    foundryItem.system.gewicht_summe = foundryItem.system.gewicht * foundryItem.system.quantity;

    // Original-ID in flags speichern
    if (originalItem._id) {
        foundryItem.flags.originalId = originalItem._id;
    }

    // ActionModifierDto in flags speichern
    if (originalItem.actionModifierDto) {
        foundryItem.flags.originalActionModifier = originalItem.actionModifierDto;
    }

    // Timestamps setzen
    const now = Date.now();
    foundryItem._stats.createdTime = now;
    foundryItem._stats.modifiedTime = now;

    return foundryItem;
}

async function convertToFoundryV12Items(inputFilePath, outputFolder) {
    try {
        const data = await fs.readFile(inputFilePath, 'utf-8');
        const items = JSON.parse(data);
        const itemsArray = Array.isArray(items) ? items : [items];

        await fs.mkdir(outputFolder, { recursive: true });

        console.log(`Verarbeite ${itemsArray.length} Gegenstand/Gegenstände...\n`);
        console.log(`Übersetzungsladen: ${Object.keys(TRANSLATIONS.COMMON_ITEM).length} Namen, ${Object.keys(TRANSLATIONS.COMMON_ITEM_DESCRIPTION).length} Beschreibungen\n`);

        // Set für eindeutige IDs
        const usedIds = new Set();

        for (const [index, originalItem] of itemsArray.entries()) {
            console.log(`\n[${index + 1}] Verarbeite: ${originalItem.name || 'Unbekannt'}`);

            // 1. Zuerst übersetzen
            const translatedItem = translateItemData(originalItem);

            // 2. Eindeutige Foundry ID generieren
            let documentId;
            do {
                documentId = generateFoundryId();
            } while (usedIds.has(documentId));
            usedIds.add(documentId);

            // 3. Foundry-Dateinamen erstellen (Name_ID)
            const fileName = createFoundryFilename(translatedItem.name, documentId);
            const filePath = path.join(outputFolder, `${fileName}.json`);

            console.log(`   Document ID: ${documentId}`);
            console.log(`   Dateiname: ${fileName}.json`);

            // 4. Zu Foundry Item konvertieren
            const foundryItem = mapToFoundryItem(translatedItem, originalItem, documentId);

            // 5. Datei schreiben
            await fs.writeFile(filePath, JSON.stringify(foundryItem, null, 2), 'utf-8');
            console.log(`   ✅ Gespeichert`);
            console.log(`   Gewicht: ${originalItem.weight || 0} -> ${foundryItem.system.gewicht}`);
        }

        console.log(`\n🎉 Fertig! ${itemsArray.length} Dateien in: ${path.resolve(outputFolder)}`);
        console.log(`📁 Foundry-Dateinamen-Konvention:`);
        console.log(`   normalisierter_name_ID.json`);

        // Erstelle Beispiel-Ausgabe
        if (itemsArray.length > 0) {
            const firstItem = itemsArray[0];
            const translatedFirst = translateItemData(firstItem);
            const exampleId = Array.from(usedIds)[0];
            const exampleFilename = createFoundryFilename(translatedFirst.name, exampleId);
            console.log(`\n📄 Beispiel für "Überlebensfertigkeiten":`);
            console.log(`   Dateiname: ${exampleFilename}.json`);
            console.log(`   JSON _id: "${exampleId}"`);
            console.log(`   JSON _key: "!items!${exampleId}"`);
        }

    } catch (error) {
        console.error('❌ Fehler:', error.message);
        process.exit(1);
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log(`
Verwendung: node convertToFoundryV12Items.mjs <input.json> <ausgabe-ordner>

Beispiel:
  node convertToFoundryV12Items.mjs gegenstaende.json ./foundry_items/

Ihre Eingabe-JSON sollte so aussehen:
  [
    {
      "_id": "1",
      "name": "ABAKUS",
      "description": "ABAKUS_DESCRIPTION",
      "cost": 10,
      "weight": 500.0
    },
    ...
  ]
        `);
        process.exit(1);
    }

    const inputFile = path.resolve(args[0]);
    const outputDir = path.resolve(args[1]);

    await convertToFoundryV12Items(inputFile, outputDir);
}

main();