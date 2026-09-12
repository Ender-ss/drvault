export interface ScaledAd {
  id: string
  brand: string
  title: string
  niche: 'Diabetes' | 'Emagrecimento' | 'Alzheimer' | 'Neuropatia' | 'Disfunção Erétil' | 'Dental' | 'Geral'
  platform: 'meta' | 'tiktok' | 'youtube'
  daysActive: number
  scaleScore: number // 0 - 100
  country: string
  hook: string
  angle: string
  copySnippet: string
  videoUrl: string
  thumbUrl: string
  landingPageUrl?: string
  adsLibraryUrl?: string
  format: 'UGC' | 'Avatar/Doctor' | 'B-Roll Recipe' | 'News/PR' | 'Street Interview'
}

export const scaledAdsData: ScaledAd[] = [
  {
    id: 'ad-spy-01',
    brand: 'NeuroRestore Health',
    title: 'Warm Pink Salt Feet Soak for Diabetic Neuropathy',
    niche: 'Neuropatia',
    platform: 'meta',
    daysActive: 47,
    scaleScore: 98,
    country: 'US',
    hook: '"If your feet burn or tingle at night, stop taking pills and do this 30-second kitchen soak..."',
    angle: 'Receita Caseira / Alívio Imediato Noturno',
    copySnippet: 'Scientists at Johns Hopkins discovered that nerve burning in feet is caused by lack of microcirculation, not age. Drinking this mineral blend with warm water before bed calms the nerves in 10 minutes.',
    videoUrl: 'https://youtube.com/shorts/mwEzHSMxcSI',
    thumbUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    landingPageUrl: 'https://example.com/vsl-neuropathy',
    adsLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=neuropathy%20feet%20soak',
    format: 'B-Roll Recipe'
  },
  {
    id: 'ad-spy-02',
    brand: 'GlycoGuard Daily',
    title: 'The 10-Second Bedtime Method for High Blood Sugar',
    niche: 'Diabetes',
    platform: 'meta',
    daysActive: 38,
    scaleScore: 96,
    country: 'US',
    hook: '"Big Pharma wants you on insulin forever, but this Harvard doctor revealed what happens when you drink this before 9 PM..."',
    angle: 'Conspiração Farmacêutica + Revelação de Médico',
    copySnippet: 'When you take this 1 teaspoon before going to sleep, it clears the toxic fat clogged in your pancreas, normalizing glucose levels naturally by morning.',
    videoUrl: 'https://www.tiktok.com/@dr_oz/video/7356014111366466862',
    thumbUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
    landingPageUrl: 'https://example.com/vsl-diabetes',
    adsLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=diabetes%20bedtime%20ritual',
    format: 'Avatar/Doctor'
  },
  {
    id: 'ad-spy-03',
    brand: 'BioFit Ritual',
    title: 'Gelatin Morning Trick That Melts 2lbs of Visceral Fat',
    niche: 'Emagrecimento',
    platform: 'tiktok',
    daysActive: 29,
    scaleScore: 94,
    country: 'US',
    hook: '"I was 210 lbs until my trainer from Beverly Hills told me to eat a cube of unflavored gelatin with warm lemon water..."',
    angle: 'Segredo de Hollywood / Emagrecimento Sem Dieta',
    copySnippet: 'This gelatin trick coats the gut lining and forces your body into deep thermogenesis 24 hours a day, burning visceral belly fat even while sleeping.',
    videoUrl: 'https://www.tiktok.com/@dr_oz/video/7364192712595131679',
    thumbUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    landingPageUrl: 'https://example.com/vsl-weightloss',
    adsLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=gelatin%20trick%20belly%20fat',
    format: 'UGC'
  },
  {
    id: 'ad-spy-04',
    brand: 'CogniClear Mind',
    title: 'The "Forgotten Name" Dementia Warning Sign',
    niche: 'Alzheimer',
    platform: 'meta',
    daysActive: 42,
    scaleScore: 97,
    country: 'US',
    hook: '"She forgot her daughter\'s name at dinner. 3 weeks later, doing this morning kitchen trick restored her memory..."',
    angle: 'História Emocional Familiar + Alívio Imediato',
    copySnippet: 'Alzheimer and dementia are not permanent memory loss—they are caused by a sticky brain protein that can be dissolved with this simple morning drink.',
    videoUrl: 'https://youtu.be/jL1BXSlnFCo',
    thumbUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80',
    landingPageUrl: 'https://example.com/vsl-alzheimer',
    adsLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=forgot%20her%20name%20Alzheimer',
    format: 'UGC'
  },
  {
    id: 'ad-spy-05',
    brand: 'Apex Men Tonic',
    title: 'The 7-Second Blue Tonic for Rock Solid Blood Flow',
    niche: 'Disfunção Erétil',
    platform: 'meta',
    daysActive: 51,
    scaleScore: 99,
    country: 'US',
    hook: '"Urologists are furious! This 7-second blue tonic increases nitric oxide by 400% without blue pills..."',
    angle: 'Alternativa Natural ao Viagra / Desafio dos Urologistas',
    copySnippet: 'A secret discovery in the Amazon basin showed that chewing this root compound boosts endothelial function and triggers firm erections on demand.',
    videoUrl: 'https://youtu.be/WB14XBg-7qM',
    thumbUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    landingPageUrl: 'https://example.com/vsl-ed',
    adsLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=blue%20tonic%20men%20blood%20flow',
    format: 'Avatar/Doctor'
  },
  {
    id: 'ad-spy-06',
    brand: 'DentPure Pro',
    title: 'Purple Gum Swish That Rebuilds Enamel and Stops Bleeding',
    niche: 'Dental',
    platform: 'tiktok',
    daysActive: 33,
    scaleScore: 92,
    country: 'US',
    hook: '"Stop brushing with normal toothpaste. This purple mineral chew repopulates good mouth bacteria in 14 days..."',
    angle: 'Nova Categoria / Microbioma Oral',
    copySnippet: '98% of gum decay and loose teeth are caused by toxic chemicals in commercial toothpastes. Swishing this purple probiotic candy repopulates protective bacteria.',
    videoUrl: 'https://youtu.be/4nt1-ZoRlag',
    thumbUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80',
    landingPageUrl: 'https://example.com/vsl-dental',
    adsLibraryUrl: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=rebuild%20gums%20probiotic%20candy',
    format: 'Street Interview'
  }
]
