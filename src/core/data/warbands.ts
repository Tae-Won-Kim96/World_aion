// 적 세력: 생성 던전은 지형 하나와 세력 하나(혼성 변이면 둘)를 고른다
export interface WarbandDef {
  id: string;
  name: string;
  owner: string;          // 던전 이름에 쓰는 주인 ('쥐왕의 하수도')
  desc: string;
  color: string;
  regulars: string[];
  elites: string[];
  bosses: string[];
  minRisk: number;        // 이 위험도부터 등장
}

export const WARBANDS: Record<string, WarbandDef> = Object.fromEntries(
  ([
    { id: 'undead', name: '망자의 군세', owner: '망자', color: '#8a6fd1', minRisk: 1,
      desc: '안식을 거부당한 해골과 구울이 무덤을 지킨다.',
      regulars: ['skel_warrior', 'skel_archer', 'ghoul', 'wraith', 'bone_mage', 'grave_hound'], elites: ['bone_knight', 'stitched_brute'], bosses: ['bishop', 'lich_lord'] },
    { id: 'abyss', name: '심연의 성가대', owner: '심연', color: '#2ec4b6', minRisk: 2,
      desc: '바다 밑 옛 신을 노래하는 딥원과 세이렌.',
      regulars: ['deep_spawn', 'drowned', 'abyss_chanter', 'siren', 'brine_witch'], elites: ['deep_brute', 'leviathan_spawn'], bosses: ['high_priest', 'drowned_queen'] },
    { id: 'sewer', name: '쥐왕의 하수도', owner: '쥐왕', color: '#a0a050', minRisk: 1,
      desc: '쥐떼, 고블린, 약쟁이가 들끓는 폐허의 하수도.',
      regulars: ['rat_pack', 'goblin_raider', 'goblin_shaman', 'kobold_trapper', 'sewer_junkie', 'green_slime'], elites: ['rat_ogre', 'plague_bearer'], bosses: ['rat_king', 'sewer_baron'] },
    { id: 'elemental', name: '폭주한 정령', owner: '정령', color: '#ff9f43', minRisk: 3,
      desc: '대붕괴로 미쳐 버린 원소의 정령들.',
      regulars: ['ember_wisp', 'tide_wisp', 'gale_wisp', 'stone_wisp', 'mad_salamander'], elites: ['magma_golem', 'storm_caller'], bosses: ['primordial_flame', 'tide_sovereign'] },
    { id: 'beasts', name: '야수 약탈단', owner: '야수왕', color: '#a7c957', minRisk: 1,
      desc: '수인과 미노타우로스가 뭉친 사냥꾼 무리.',
      regulars: ['wolf_raider', 'bear_mauler', 'cat_stalker', 'hawk_scout', 'boar_shaman'], elites: ['minotaur_charger', 'pack_alpha'], bosses: ['beast_king', 'great_minotaur'] },
    { id: 'infernal', name: '지옥문 계약단', owner: '지옥문', color: '#ff6b35', minRisk: 4,
      desc: '계약서를 든 악마와 임프, 흑마법사들.',
      regulars: ['imp_trickster', 'hell_brute', 'contract_warlock', 'hellhound', 'cultist'], elites: ['pit_fiend', 'succubus'], bosses: ['arch_devil', 'hell_collector'] },
    { id: 'rust', name: '녹슨 군단', owner: '태엽왕', color: '#d8b45a', minRisk: 3,
      desc: '주인을 잃고도 행군을 멈추지 않는 태엽 병사들.',
      regulars: ['clock_soldier', 'clock_gunner', 'scrap_tinker', 'saw_drone'], elites: ['siege_golem', 'artillery_unit'], bosses: ['clockwork_king', 'mad_inventor'] },
    { id: 'spore', name: '포자 교단', owner: '포자', color: '#c86aa0', minRisk: 2,
      desc: '모두가 하나의 균사로 이어져야 한다고 믿는 자들.',
      regulars: ['spore_acolyte', 'rot_dryad', 'mad_plaguedoc', 'fungal_thrall', 'spore_junkie', 'green_slime'], elites: ['fungal_colossus', 'rot_treant'], bosses: ['mother_spore', 'plague_saint'] },
    { id: 'night', name: '밤의 궁정', owner: '밤의 여왕', color: '#b5179e', minRisk: 4,
      desc: '흡혈귀 귀족과 그림자, 망자 근위병.',
      regulars: ['vampire_thrall', 'blood_maiden', 'shade_stalker', 'revenant_guard', 'bat_swarm'], elites: ['vampire_knight', 'night_countess'], bosses: ['night_queen', 'old_count'] },
    { id: 'dragon', name: '용의 둥지', owner: '고룡', color: '#e85a3a', minRisk: 5,
      desc: '용을 숭배하는 코볼트와 리자드맨, 그리고 용인.',
      regulars: ['kobold_spearman', 'kobold_slinger', 'lizard_hunter', 'drake_cultist', 'young_drakeling'], elites: ['drake_rider', 'dragon_priest'], bosses: ['elder_drake', 'kobold_king'] },
    { id: 'zealots', name: '광신 성기사단', owner: '심문관', color: '#f4d35e', minRisk: 3,
      desc: '세계핵을 신성모독이라 부르며 결속자를 사냥하는 광신자들.',
      regulars: ['zealot_knight', 'inquisitor', 'flagellant', 'zealot_priest', 'exorcist_hunter'], elites: ['grand_inquisitor', 'templar_champion'], bosses: ['fallen_seraph', 'high_inquisitor'] },
    { id: 'circus', name: '공포의 유랑 서커스', owner: '단장', color: '#ff6a8a', minRisk: 2,
      desc: '관객이 죽어도 공연을 멈추지 않는 유랑 극단.',
      regulars: ['mad_clown', 'knife_thrower', 'strongman', 'puppet_aide', 'fire_eater'], elites: ['acrobat_killer', 'giant_puppet'], bosses: ['ringmaster', 'laughing_jester'] },
    { id: 'bandits', name: '도적 연합', owner: '도적왕', color: '#9a8a7a', minRisk: 1,
      desc: '폐허의 길목마다 통행료를 받는 무법자들.',
      regulars: ['grave_robber', 'cutthroat', 'bandit_archer', 'debt_thug', 'deserter_gunner'], elites: ['bandit_captain', 'headsman'], bosses: ['bandit_king', 'loan_baron'] },
    { id: 'rift', name: '균열의 군세', owner: '균열', color: '#8a4aff', minRisk: 6,
      desc: '대붕괴의 균열에서 흘러나온 형체 없는 것들. 결속자에게 특히 위험하다.',
      regulars: ['void_spawn', 'void_eye', 'rift_shade', 'wraith', 'cultist'], elites: ['rift_horror', 'shard_golem'], bosses: ['rift_maw', 'fallen_commander'] },
    { id: 'frost', name: '서리 부족', owner: '겨울', color: '#9ad8ff', minRisk: 3,
      desc: '눈보라와 함께 내려오는 예티와 서리 마녀.',
      regulars: ['yeti_brute', 'frost_witch', 'ice_wolf', 'snow_hunter', 'frost_shaman'], elites: ['frost_giant', 'ice_wraith'], bosses: ['winter_matron', 'yeti_chieftain'] },
    { id: 'desert', name: '사막 망령', owner: '파라오', color: '#e2b84a', minRisk: 4,
      desc: '모래 속에 잠든 왕조와 그 무덤을 지키는 자들.',
      regulars: ['sand_mummy', 'scorpion_kin', 'sand_witch', 'dune_raider', 'tomb_cultist'], elites: ['tomb_guardian', 'cursed_priest'], bosses: ['sand_pharaoh', 'great_scorpion'] },
  ] as WarbandDef[]).map((w) => [w.id, w]),
);

export const WARBAND_IDS = Object.keys(WARBANDS);
