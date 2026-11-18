import trypillia from './artworks/trypillia-vessel.jpg';
import sofia from './artworks/sofia.jpg';
import christ from './artworks/christ.jpg';
import nativity from './artworks/nativity.jpg';
import khotyn from './artworks/khotyn.jpg';
import easter from './artworks/easter.webp';
import harvest from './artworks/harvest-festival.jpg';
import boriviter from './artworks/boriviter.jpg';
import roitburd from './artworks/roitburd.jpg';
import makov from './artworks/makov.png';
import palianytsia from './artworks/palianytsia.webp';
import raiko from './artworks/raiko.jpg';
import tram from './artworks/tram.jpg';

export const epochPreviews: Partial<Record<number, { image?: string; caption: string; source?: { label: string; url: string } }>> = {
  1: { image: trypillia, caption: 'Посудина з розписом. Середина IV тис. до н. е. Трипільська культура. Розкопки В. Хвойки. Національний музей історії України' },
  2: { image: sofia, caption: '«Княжий портрет» (фрагмент фрески), Софія Київська.', source: { label: 'nrpcult.ukma.edu.ua', url: 'https://nrpcult.ukma.edu.ua/article/view/361957' } },
  3: { image: christ, caption: 'Ікона «Спас у славі».', source: { label: 'Мистецький Альманах АРТЕС', url: 'https://artes-almanac.com/spas-u-slavi/' } },
  4: { image: nativity, caption: '«Різдво Марії», Микола Петрахнович-Мороховський. З іконостаса Успенської церкви у Львові.', source: { label: 'uacademic.info', url: 'https://www.uacademic.info/download/file/0400U000786/k%200786-00.docx' } },
  5: { image: khotyn, caption: '«Смерть Яна Кароля Ходкевича в таборі під Хотином», Франциск Смуглевич.', source: { label: 'polskipetersburg.pl', url: 'https://www.polskipetersburg.pl/hasla/smuglewicz-szmuglewicz-franciszek' } },
  6: { image: easter, caption: '«Ранок Христового Воскресіння», Микола Пимоненко.', source: { label: 'Локальна історія', url: 'https://localhistory.org.ua/rubrics/painting/mikola-pimonenko-ranok-khristovogo-voskresinnia/' } },
  7: { image: tram, caption: '«Трамвай», Олександр Богомазов.', source: { label: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Bogomazov-tram-s-1914.jpg' } },
  8: { image: harvest, caption: '«Свято врожаю», Михайло Бойчук. Фреска Червонозаводського театру, Харків.', source: { label: 'old.archives.gov.ua', url: 'https://old.archives.gov.ua/Sections/Persons/Boychuk/index.php' } },
  9: { image: raiko, caption: 'Настінні розписи власного будинку, Поліна Райко. Олешки.', source: { label: 'etnolog.org.ua', url: 'https://www.etnolog.org.ua/pdf/stories/monografiji/2019/glob.pdf' } },
  10: { image: boriviter, caption: '«Боривітер», Алла Горська, Віктор Зарецький, Галина Зубченко, Григорій Пришедько, Борис Плаксій. Маріуполь.', source: { label: 'Панно «Боривітер», ресторан', url: 'https://sovietmosaicsinukraine.org/ua/mosaic/8' } },
  11: { image: roitburd, caption: '«Автопортрет», Олександр Ройтбурд.', source: { label: 'Adamovskiy Foundation', url: 'https://adamovskiy.foundation/collection/avtoportret-2/' } },
  12: { image: makov, caption: '«Запрошення», Павло Маков' },
  13: { image: palianytsia, caption: '«Паляниця», Жанна Кадирова та Денис Рубан.', source: { label: 'Архів Дослідницької платформи', url: 'https://prize.pinchukartcentre.org/works-rp/zhanna-kadirova-palyaniczya-2022-doteper-znajdene-richkove-kaminnya-stil-skatertina' } },
};
