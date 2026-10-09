import { AdvisoryDocument, RAGChunk } from '../types';

export const OFFICIAL_ADVISORIES: AdvisoryDocument[] = [
  {
    id: 'da-awd-2024',
    title: 'DA Advisory No. 2024-03: Alternate Wetting and Drying (AWD) & Rice Drought Protocol',
    source: 'DA_AWD_Rice_Protocol_2024.pdf',
    agency: 'DA',
    date: 'February 2024',
    category: 'Agriculture & Rice',
    pageCount: 3,
    summary: 'Guidelines on water-saving irrigation technology (AWD), drought-tolerant seed varieties, and solar pump optimization for rice farmers.',
    fullText: `[PAGE 1]
KAGAWARAN NG PAGSASAKA (DEPARTMENT OF AGRICULTURE) - PHILRICE
ADVISORY NO. 2024-03: GABAY SA ALTERNATE WETTING AND DRYING (AWD) AT PANANANIM SA PANAHON NG EL NIÑO

1. Paggamit ng Observation Well (Field Water Tube):
Magbaon ng 20-centimeter perforated PVC pipe (may mga butas sa gilid na 5mm ang layo) na 10 sentimetro ang lalim sa lupa ng palayan.
Sukatin ang lebel ng tubig sa loob ng tubo araw-araw gamit ang patpat o ruler.
Huwag magpatubig hangga't hindi bumababa ang lebel ng tubig sa 15 sentimetro sa ilalim ng lupa (-15 cm). Kapag umabot sa -15 cm, saka lamang magpatubig ng hanggang 5 sentimetro sa ibabaw ng lupa (+5 cm).
Ayon sa DA at PhilRice, ang AWD ay nakakatipid ng 30% hanggang 50% sa patubig nang hindi bumababa ang ani ng palay.

[PAGE 2]
2. Kritikal na Yugto ng Palay (Panicle Initiation hanggang Flowering):
Mahigpit na ibawal ang pagpapatuyo kapag ang palay ay nasa yugto ng panicle initiation (pagbubuntis) hanggang flowering stage (pamumulaklak). Sa mga linggong ito, panatilihin ang 2 hanggang 3 sentimetrong tubig upang maiwasan ang pagkabaog o pagkakaroon ng ipang palay.

3. Pagpili ng Matitibay na Binhi (Drought-Tolerant Varieties):
Para sa mga lugar na mababa ang antas ng tubig sa irigasyon o umaasa sa ulan (rainfed):
- NSIC Rc192 (Sahod Ulan 1) - maturation: 106-112 days, matibay sa tuyong lupa.
- PSB Rc10 (Pagsanjan) - subok na drought-resistant variety.
- NSIC Rc222 (Tubigan 18) - mataas ang ani kahit limitado ang irigasyon.
- NSIC Rc14 (Matatag 2) - angkop sa delayed rainfall.

[PAGE 3]
4. Oras ng Pagpapatubig at Pumping:
Ipatubig lamang sa madaling araw (bago mag-7:00 AM) o bandang hapon (makalipas ang 4:30 PM). Kapag nagpatubig sa katanghalian, mahigit 40% ng tubig ang agad na sumisingaw sa hangin (evaporation).

5. Pakikipag-ugnayan sa Irrigators Association (IA) at NIA:
Magpatupad ng mahigpit na 'Rotational Irrigation Schedule' sa pagitan ng mga purok at lateral canals upang masiguro na ang dulo ng kanal (tail-end farmers) ay makakatanggap pa rin ng sapat na patubig.`,
    chunks: [
      `Para sa mga palayan na kulang sa tubig: Magbaon ng 20cm perforated PVC pipe na 10cm ang lalim sa lupa. Huwag magpatubig hangga't hindi bumababa ang tubig sa 15cm sa ilalim ng lupa (-15cm). Kapag umabot dito, magpatubig lamang ng 5cm. Nakakatipid ito ng 30% hanggang 50% sa patubig nang hindi bumababa ang ani. [DA_AWD_Rice_Protocol_2024.pdf, Page 1]`,
      `Kritikal na Yugto ng Palay: Huwag patuyuin ang palayan sa panicle initiation (pagbubuntis) hanggang flowering (pamumulaklak). Panatilihin ang 2-3cm na tubig upang hindi mabaog ang mga butil ng palay. [DA_AWD_Rice_Protocol_2024.pdf, Page 2]`,
      `Magtanim ng drought-tolerant certified rice seed varieties tulad ng NSIC Rc192 (Sahod Ulan 1), PSB Rc10 (Pagsanjan), o NSIC Rc222 (Tubigan 18) na matibay sa kakulangan sa patubig. [DA_AWD_Rice_Protocol_2024.pdf, Page 2]`,
      `Magpatubig lamang sa madaling araw (bago mag-7:00 AM) o bandang hapon (paglampas ng 4:30 PM) upang maiwasan ang pagsingaw ng mahigit 40% ng tubig dahil sa init ng araw. [DA_AWD_Rice_Protocol_2024.pdf, Page 3]`,
      `Makipag-ugnayan sa NIA at Irrigators Association (IA) para sa mahigpit na Rotational Irrigation Schedule upang mabigyan ng tubig maging ang tail-end farmers sa dulo ng kanal. [DA_AWD_Rice_Protocol_2024.pdf, Page 3]`
    ]
  },
  {
    id: 'pagasa-bulletin-14',
    title: 'PAGASA Drought Bulletin #14: Strong El Niño Rainfall Anomaly and Prolonged Dry Spell Advisory',
    source: 'PAGASA_Drought_Bulletin_14.pdf',
    agency: 'PAGASA',
    date: 'March 2024',
    category: 'Weather & Climate',
    pageCount: 2,
    summary: 'Meteorological drought diagnosis, regional rainfall reductions exceeding 60%, heat index forecasts (42-46°C), and water conservation warnings.',
    fullText: `[PAGE 1]
DOST - PHILIPPINE ATMOSPHERIC, GEOPHYSICAL AND ASTRONOMICAL SERVICES ADMINISTRATION (PAGASA)
CLIMATE MONITORING AND PREDICTION SECTION (CLIMPS)
DROUGHT BULLETIN NO. 14: EL NIÑO ADVISORY AT ANOMALYA SA PATAK NG ULAN

1. Katayuan ng Tagtuyot sa Pilipinas:
Kasalukuyang umiiral ang Strong El Niño sa Tropical Pacific. Mahigit 30 probinsya sa Luzon (partikular ang Cagayan Valley, Central Luzon, MIMAROPA) at Western Visayas ang nasa ilalim ng 'Meteorological Drought' kung saan ang buwanang ulan ay bumaba ng mahigit 60% sa loob ng tatlong magkakasunod na buwan.

2. Inaasahang Tagal at Paglipat ng Panahon:
Ang matinding tagtuyot at tuyong hangin ay magpapatuloy hanggang huling bahagi ng Mayo. Ang unti-unting pagdating ng localized rains at Southwest Monsoon (Habagat) ay tinatayang magsisimula lamang sa ikalawa hanggang ikatlong linggo ng Hunyo.

[PAGE 2]
3. Mapanganib na Heat Index (42°C hanggang 46°C):
Ang pang-araw-araw na heat index sa mga kapatagan ay patuloy na aabot sa 'Danger' category. Ipinapayo ang matinding pag-iingat sa mga outdoor workers, magsasaka, at construction laborers laban sa heat exhaustion.

4. Rainwater Harvesting at Pangangalaga sa Suplay ng Tubig:
Inaatasan ang mga barangay at pamahalaang lokal na:
- Samantalahin ang paminsan-minsang convective thunderstorm sa pamamagitan ng pag-aayos ng rainwater catchment tanks at tambol.
- Ipagbawal ang walang habas na pagpapatapon ng tubig sa mga pampublikong gusali.
- Regular na inspeksyunin ang lebel ng tubig sa mga communal spring at shallow wells.`,
    chunks: [
      `Ayon sa PAGASA, umiiral ang meteorological drought (mahigit 60% rainfall reduction sa loob ng 3 buwan) sa Luzon at Western Visayas at inaasahang magpapatuloy ang tagtuyot hanggang huling linggo ng Mayo. [PAGASA_Drought_Bulletin_14.pdf, Page 1]`,
      `Babala sa Heat Index: Ang init ay aabot sa Danger category (42°C hanggang 46°C). Iwasan ang matagal na pagbibilad sa araw at maglagay ng lilim sa mga pampublikong tagpuan. [PAGASA_Drought_Bulletin_14.pdf, Page 2]`,
      `Mag-imbak ng tubig-ulan sa pamamagitan ng mga rainwater catchment systems at tambol sa tuwing may paminsan-minsang localized thunderstorms sa hapon. [PAGASA_Drought_Bulletin_14.pdf, Page 2]`,
      `Subaybayan ang lingguhang rainfall forecast mula sa pinakamalapit na DOST-PAGASA Agromet station upang maiplano nang maayos ang crop scheduling. [PAGASA_Drought_Bulletin_14.pdf, Page 2]`
    ]
  },
  {
    id: 'doh-heat-protocol',
    title: 'DOH Heat Health Protocol 2024-08: Prevention and First Aid for Heat Exhaustion and Heat Stroke',
    source: 'DOH_Heat_Health_Protocol_2024.pdf',
    agency: 'DOH',
    date: 'April 2024',
    category: 'Public Health',
    pageCount: 3,
    summary: 'Clinical guidelines for agricultural workers, split-shift labor hours, dehydration mitigation (ORS/electrolytes), and life-saving first aid.',
    fullText: `[PAGE 1]
KAGAWARAN NG KALUSUGAN (DEPARTMENT OF HEALTH)
HEALTH EMERGENCY MANAGEMENT BUREAU (HEMB)
MEMORANDUM CIRCULAR NO. 2024-08: GABAY SA KALUSUGAN NG MAGSASAKA AT MANGGAGAWA SA MATINDING INIT

1. Split-Shift System sa Pagsasaka:
Iwasan ang mabigat na pisikal na paggawa sa bukid sa peak heat hours (10:00 AM hanggang 3:00 PM).
Ipatupad ang Split Shift:
- Umaga: 5:00 AM hanggang 9:30 AM
- Pahinga at silong: 10:00 AM hanggang 3:30 PM
- Hapon: 3:30 PM hanggang 6:00 PM

[PAGE 2]
2. Tamang Pag-inom ng Tubig at Electrolytes:
Uminom ng hindi bababa sa 2.5 hanggang 3 litro ng malinis na tubig bawat araw. Uminom ng 1 basong tubig bawat 20 minuto sa bukid kahit hindi pa nauuhaw.
Iwasan ang pag-inom ng labis na kape, enerhiya drinks, o alak habang nagtatrabaho dahil lalong pinapabilis nito ang dehydration.
Kapag labis ang pawis, magtimpla ng Oral Rehydration Salt (ORS) sa 1 litrong tubig, o lutong-bahay na solusyon (1/2 kutsaritang asin + 6 kutsaritang asuk sa 1 litrong malinis na tubig).

[PAGE 3]
3. First Aid sa Heat Exhaustion:
Sintomas: Pagkahilo, panlalambot, pamumutla, labis na pagpapawis, pananakit ng ulo, muscle cramps.
Hakbang: Dalhin agad ang pasyente sa malilim at mahanging lugar; pahigain at itaas ang mga binti ng 30 sentimetro; luwagan ang damit; maglapat ng basang malamig na bimpo sa noo, leeg, at kilikili; at painumin ng tubig o ORS nang dahan-dahan.

4. First Aid sa Heat Stroke (EMERGENCY):
Sintomas: Nawawalan ng malay, temperatura na lagpas 40°C, TUYO AT PUMUPUTOK NA BALAT (WALANG PAWIS), pagkalito, kombulsyon.
Hakbang: TUMAWAG AGAD NG AMBULANSYA, RHU, O BHERT. Agarang palamigin ang katawan habang naghihintay: buhusan ng malamig na tubig ang katawan, lagyan ng yelo sa kilikili, leeg, at singit. HUWAG piliting painumin kapag walang malay.`,
    chunks: [
      `Ipatupad ang Split-Shift System sa bukid: magtrabaho mula 5:00 AM hanggang 9:30 AM at 3:30 PM hanggang 6:00 PM. Mahigpit na ipagbawal ang mabigat na trabaho sa bukid sa pagitan ng 10:00 AM at 3:00 PM kung kailan pinakamatindi ang heat index. [DOH_Heat_Health_Protocol_2024.pdf, Page 1]`,
      `Uminom ng 1 basong tubig bawat 20 minuto habang nagtatrabaho kahit hindi pa nauuhaw. Maghalo ng 1 pakete ng Oral Rehydration Salt (ORS) sa 1 litrong tubig kung labis ang pagpapawis. Iwasan ang kape at alak sa bukid. [DOH_Heat_Health_Protocol_2024.pdf, Page 2]`,
      `First Aid sa Heat Exhaustion (pagkahilo, pamumutla, pawis): Ilipat agad sa lilim, pahigain at itaas ang paa ng 30cm, lagyan ng basang bimpo sa leeg at kilikili, at dahan-dahang painumin ng tubig. [DOH_Heat_Health_Protocol_2024.pdf, Page 3]`,
      `First Aid sa Heat Stroke (walang malay, temperatura > 40°C, tuyong balat na walang pawis): Tumawag agad ng ambulansya/BHERT. Buhusan ng malamig na tubig ang katawan, lagyan ng yelo sa leeg, kilikili, at singit habang naghihintay. Huwag painumin kung walang malay. [DOH_Heat_Health_Protocol_2024.pdf, Page 3]`
    ]
  },
  {
    id: 'da-bai-livestock-guide',
    title: 'DA-BAI Advisory No. 05: Heat Stress Management for Livestock and Poultry',
    source: 'DA_BAI_Livestock_Heat_Stress_Guide.pdf',
    agency: 'DA-BAI',
    date: 'March 2024',
    category: 'Livestock & Poultry',
    pageCount: 2,
    summary: 'Cooling mechanisms for hogs, broilers, and cattle; water temperature control; misting schedules; avoiding fatal heat prostration.',
    fullText: `[PAGE 1]
BUREAU OF ANIMAL INDUSTRY (DA-BAI)
LIVESTOCK AND POULTRY DIVISION
ADVISORY NO. 05: PROTEKSYON NG MGA ALAGANG HAYOP LABAN SA HEAT STRESS

1. Pabahay at Bentilasyon:
Takpan ng tuyong cogon, nipa, o insulation foil ang bubong ng kulungan ng baboy at manok. Maaari ding pinturahan ng puting pintura ang yero upang mapatalsik ang init ng araw (reflective cooling). Tiyaking may tuluy-tuloy na daloy ng hangin sa pamamagitan ng pag-alis sa mga harang sa gilid ng kulungan.

2. Tubig-Inumin:
Doblehin ang bilang ng inuman ng tubig. Ang mga baboy at manok ay umiinom ng hanggang 3 beses ng kanilang karaniwang dami kapag mainit. Siguraduhing malamig ang tubig at hindi naiinitan ang mga hose o tangke ng tubig.

[PAGE 2]
3. Pag-spray ng Tubig (Misting):
Mag-spray ng pinong ambon o mist sa bubong at hangin sa paligid ng kulungan mula 11:00 AM hanggang 2:00 PM.
BABALA: Huwag buhusan ng malamig na tubig o yelo ang likod ng sobrang init na baboy! Ang biglaang paglamig ay sanhi ng shock at atake sa puso (heart failure). Sa sahig lamang magbasa.

4. Oras ng Pagpapakain at Bitamina:
Pakainin ang mga hayop sa mas malamig na oras: madaling araw (5:00 AM - 6:30 AM) at gabi (6:30 PM - 8:00 PM). Maghalo ng electrolytes at Vitamin C sa inuming tubig.`,
    chunks: [
      `Lagyan ng insulation o tuyong dahon ng cogon/nipa ang bubong ng kulungan, o pinturahan ng puti upang mapababa ang init ng hanggang 4°C hanggang 6°C. [DA_BAI_Livestock_Heat_Stress_Guide.pdf, Page 1]`,
      `Doblehin ang inuming tubig ng baboy at manok; panatilihing malilim ang mga tubo ng tubig upang hindi kumulo ang inumin ng hayop. [DA_BAI_Livestock_Heat_Stress_Guide.pdf, Page 1]`,
      `Magwisik ng mist o ambon ng tubig sa bubong at sa hangin sa paligid ng kulungan mula 11:00 AM hanggang 2:00 PM. Huwag direktang buhusan ng malamig na tubig ang katawan ng mainit na baboy upang maiwasan ang thermal cardiac arrest. [DA_BAI_Livestock_Heat_Stress_Guide.pdf, Page 2]`,
      `I-shift ang pagpapakain sa malamig na oras ng gabi at madaling araw; maghalo ng Vitamin C at electrolytes sa inuming tubig laban sa heat prostration. [DA_BAI_Livestock_Heat_Stress_Guide.pdf, Page 2]`
    ]
  },
  {
    id: 'dilg-water-rationing-mc',
    title: 'DILG-LGU Memorandum Circular 2024-21: Barangay Water Rationing & Contingency Protocol',
    source: 'DILG_LGU_Water_Contingency_MC2024.pdf',
    agency: 'DILG',
    date: 'April 2024',
    category: 'Community & LGU',
    pageCount: 2,
    summary: 'Directives for Barangay Captains and BDRRMC: Water marshals, deep well quotas, drinking water prioritization, and chlorination standards.',
    fullText: `[PAGE 1]
DEPARTMENT OF THE INTERIOR AND LOCAL GOVERNMENT (DILG)
NATIONAL DISASTER RISK REDUCTION AND MANAGEMENT COUNCIL (NDRRMC)
MEMORANDUM CIRCULAR NO. 2024-21: MGA DIREKTIBA SA BARANGAY PARA SA PAGTITIPID AT RATIONING NG TUBIG

1. Pagtatag ng Barangay Water Crisis Committee:
Ang Punong Barangay kasama ang BDRRMC ay dapat magtalaga ng 'Water Marshals' sa bawat purok upang mag-organisa ng maayos na pila sa communal deep wells at water refilling outlets.

2. Skedyul ng Water Rationing at Quota:
Tuwing critical shortage, ipatupad ang maximum na 20 litro ng malinis na tubig bawat sambahayan bawat araw para sa inumin at pagluluto.
Magtakda ng partikular na oras ng pagbubukas ng communal wells (halimbawa: 6:00 AM - 9:00 AM at 4:00 PM - 7:00 PM) upang mabigyan ng panahon ang underground aquifer na mag-recharge.

[PAGE 2]
3. Mahigpit na Pagbabawal sa Aksayang Paggamit ng Tubig:
Ipagbawal sa pamamagitan ng Barangay Executive Order ang paggamit ng running hose sa paghuhugas ng sasakyan, pagdidilig ng ornamental lawn, at pagpupuno ng recreational pools gamit ang inuming tubig.

4. Pagsusuri sa Kalidad at Kaligtasan ng Tubig:
Magbuhos ng chlorine tablets (Aquatabs o household bleach ayon sa tamang sukat ng DOH) o iutos ang pagpapakulo ng tubig nang tuluy-tuloy sa loob ng 3 minuto bago inumin upang maiwasan ang diarrhea, cholera, at typhoid fever outbreaks.

5. Paggamit ng Barangay Calamity Fund (QRF):
Maaaring gamitin ang 30% Quick Response Fund ng barangay para sa emergency procurement ng water storage bladders, delivery trucks, at shallow tube well rehabilitation kapag may opisyal na deklarasyon ng State of Calamity.`,
    chunks: [
      `Magtalaga ang Punong Barangay ng mga Bantay-Tubig (Water Marshals) at ipatupad ang 20-litro bawat pamilya bawat araw na quota para sa inumin at pagluluto tuwing critical shortage. [DILG_LGU_Water_Contingency_MC2024.pdf, Page 1]`,
      `Magtakda ng scheduled pumping hours sa mga communal deep wells (6:00 AM - 9:00 AM at 4:00 PM - 7:00 PM) upang mabigyan ng oras ang aquifer na mag-recharge at hindi matuyo ang balon. [DILG_LGU_Water_Contingency_MC2024.pdf, Page 1]`,
      `Mahigpit na ipagbawal ang paggamit ng potable water sa paghuhugas ng sasakyan gamit ang hose at pagdidilig ng ornamental garden sa pamamagitan ng Barangay Executive Order. [DILG_LGU_Water_Contingency_MC2024.pdf, Page 2]`,
      `Pakuluin ang inuming tubig nang 3 minuto kapag kumukulo na o gumamit ng DOH-approved chlorine tablets upang maiwasan ang gastroenteritis at waterborne diseases tuwing tagtuyot. [DILG_LGU_Water_Contingency_MC2024.pdf, Page 2]`,
      `Maaaring gamitin ng Barangay ang 30% Quick Response Fund (QRF) mula sa LDRRMF para sa pagbili ng emergency water tanks at filtration supplies kapag may State of Calamity. [DILG_LGU_Water_Contingency_MC2024.pdf, Page 2]`
    ]
  }
];

// Helper to generate chunks with page metadata
export function getInitialChunks(): RAGChunk[] {
  return OFFICIAL_ADVISORIES.flatMap(doc =>
    doc.chunks.map((chunkText, idx) => {
      // Extract page number if present in bracket citation like [filename, Page 2]
      const pageMatch = chunkText.match(/Page\s+(\d+)/i);
      const pageNum = pageMatch ? parseInt(pageMatch[1]) : (idx % (doc.pageCount || 2)) + 1;

      return {
        id: `${doc.id}-chunk-${idx + 1}`,
        documentId: doc.id,
        source: doc.source,
        title: doc.title,
        agency: doc.agency,
        category: doc.category,
        text: chunkText,
        page: pageNum
      };
    })
  );
}

export const ALL_RAG_CHUNKS: RAGChunk[] = getInitialChunks();
