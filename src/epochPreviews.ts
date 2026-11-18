import trypillia from './epoch-previews/trypillia.jpg';
import sofia from './epoch-previews/sofia.jpg';
import christ from './epoch-previews/christ.jpg';
import nativity from './epoch-previews/nativity.jpg';
import khotyn from './epoch-previews/khotyn.jpg';
import easter from './epoch-previews/easter.webp';
import harvest from './epoch-previews/harvest.jpg';
import boriviter from './epoch-previews/boriviter.jpg';
import roitburd from './epoch-previews/roitburd.jpg';
import makov from './epoch-previews/makov.png';
import palianytsia from './epoch-previews/palianytsia.webp';

export const epochPreviews: Partial<Record<number, { image?: string; caption: string }>> = {
  1: { image: trypillia, caption: 'Cucuteni_Tripolie' },
  2: { image: sofia, caption: 'Фреска «Дружина й доньки Ярослава Мудрого». Софія Київська' },
  3: { image: christ, caption: 'Христос у славі' },
  4: { image: nativity, caption: 'Петрахнович. «Різдво Марії»' },
  5: { image: khotyn, caption: 'Франциск Смуглевич. «Смерть Яна Ходкевича в Хотині»' },
  6: { image: easter, caption: 'Микола Пимоненко. «Ранок Христового Воскресіння»' },
  8: { image: harvest, caption: 'Свято врожаю' },
  9: { caption: 'Поліна Райко' },
  10: { image: boriviter, caption: 'Боривітер' },
  11: { image: roitburd, caption: 'Ройтбурд. «Автопортрет»' },
  12: { image: makov, caption: 'Павло Маков. «Запрошення»' },
  13: { image: palianytsia, caption: 'Жанна Кадирова. «Паляниця»' },
};
