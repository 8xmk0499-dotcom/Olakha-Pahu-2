'use strict';

/**
 * 🎨 ओळखा पाहू! 👀 – Draw & Guess Battle
 * मराठी आणि इंग्रजी शब्दसंग्रह (Marathi & English Word Bank)
 */

const WORDS = [
  // --- खाद्यपदार्थ (Food & Treats) ---
  {
    id: 'f1',
    mr: 'वडापाव',
    en: 'Vada Pav',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'easy',
    aliases: ['vadapav', 'vada pav', 'wadapav', 'wada pav', 'वडा पाव'],
    hint: 'महाराष्ट्राचे अतिशय प्रसिद्ध स्ट्रीट फूड',
    hintEn: 'Famous street food of Maharashtra'
  },
  {
    id: 'f2',
    mr: 'मोदक',
    en: 'Modak',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'easy',
    aliases: ['modak', 'modaka', 'मोदक'],
    hint: 'गणपती बाप्पाचा आवडता गोड पदार्थ',
    hintEn: 'Lord Ganesha’s favorite sweet dumpling'
  },
  {
    id: 'f3',
    mr: 'पुरणपोळी',
    en: 'Puran Poli',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'medium',
    aliases: ['puranpoli', 'puran poli', 'puran-poli', 'पुरण पोळी'],
    hint: 'होळी आणि सणांना बनवली जाणारी गोड पोळी',
    hintEn: 'Sweet stuffed flatbread made on Holi'
  },
  {
    id: 'f4',
    mr: 'मिसळ',
    en: 'Misal',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'medium',
    aliases: ['misal', 'misal pav', 'मिसळपाव', 'मिसळ पाव'],
    hint: 'झणझणीत रस्सा आणि फरसाण',
    hintEn: 'Spicy curry topped with farsan and onions'
  },
  {
    id: 'f5',
    mr: 'समोसा',
    en: 'Samosa',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'easy',
    aliases: ['samosa', 'samosha', 'समोसा'],
    hint: 'त्रिकोणी आकाराचा बटाट्याने भरलेला तळलेला पदार्थ',
    hintEn: 'Crispy triangle snack filled with spiced potatoes'
  },
  {
    id: 'f6',
    mr: 'लाडू',
    en: 'Laddoo',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'easy',
    aliases: ['laddu', 'laddoo', 'ladoo', 'लाडू'],
    hint: 'दिवाळीतील गोल गोड पदार्थ',
    hintEn: 'Round festival sweet'
  },
  {
    id: 'f7',
    mr: 'चहा',
    en: 'Tea',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Drinks',
    difficulty: 'easy',
    aliases: ['tea', 'chai', 'chaha', 'चहा', 'चाय'],
    hint: 'सकाळी कपातून प्यायले जाणारे गरम पेय',
    hintEn: 'Hot morning drink in a cup'
  },
  {
    id: 'f8',
    mr: 'आइस्क्रीम',
    en: 'Ice Cream',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'easy',
    aliases: ['icecream', 'ice cream', 'ice-cream', 'आईस्क्रीम'],
    hint: 'उन्हाळ्यात खाल्ली जाणारी थंडगार मिठाई',
    hintEn: 'Cold frozen sweet treat in a cone or cup'
  },
  {
    id: 'f9',
    mr: 'पिझ्झा',
    en: 'Pizza',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'easy',
    aliases: ['pizza', 'पिझ्झा', 'पिझ्झा'],
    hint: 'चीझ असलेला गोल इटालियन पदार्थ',
    hintEn: 'Round cheese flatbread cut in slices'
  },
  {
    id: 'f10',
    mr: 'नारळ',
    en: 'Coconut',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'easy',
    aliases: ['coconut', 'nariyal', 'naral', 'नारळ'],
    hint: 'बाहेरून टणक आणि आतून पांढरे पाणी असणारे फळ',
    hintEn: 'Hard brown shell fruit with water inside'
  },
  {
    id: 'f11',
    mr: 'आंबा',
    en: 'Mango',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Fruits',
    difficulty: 'easy',
    aliases: ['mango', 'aamba', 'amba', 'आंबा'],
    hint: 'फळांचा राजा',
    hintEn: 'The King of Fruits'
  },
  {
    id: 'f12',
    mr: 'जिलेबी',
    en: 'Jalebi',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'medium',
    aliases: ['jalebi', 'jilebi', 'जिलेबी'],
    hint: 'गोल-गोल कुरकुरीत रसाळ गोड पदार्थ',
    hintEn: 'Spiral crunchy syrup sweet'
  },
  {
    id: 'f13',
    mr: 'पाणीपुरी',
    en: 'Pani Puri',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'medium',
    aliases: ['panipuri', 'pani puri', 'golgappa', 'पाणी पुरी'],
    hint: 'तिखट गोड पाण्याने भरलेली कुरकुरीत पुरी',
    hintEn: 'Crispy hollow balls filled with spicy water'
  },
  {
    id: 'f14',
    mr: 'पोहे',
    en: 'Pohe',
    category: 'खाद्यपदार्थ',
    categoryEn: 'Food',
    difficulty: 'medium',
    aliases: ['pohe', 'poha', 'कांदेपोहे', 'kande pohe'],
    hint: 'कांदा आणि लिंबू घालून केलेला पिवळा नाश्ता',
    hintEn: 'Flattened rice breakfast garnished with lemon'
  },

  // --- वस्तू आणि साधने (Objects & Everyday Items) ---
  {
    id: 'o1',
    mr: 'सायकल',
    en: 'Bicycle',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'easy',
    aliases: ['cycle', 'bicycle', 'सायकल', 'बायसिकल'],
    hint: 'दोन चाके आणि पायडल असलेले वाहन',
    hintEn: 'Two-wheeled vehicle with pedals'
  },
  {
    id: 'o2',
    mr: 'छत्री',
    en: 'Umbrella',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'easy',
    aliases: ['umbrella', 'chatri', 'chhatri', 'छत्री'],
    hint: 'पावसात आणि उन्हात वापरले जाणारे साधन',
    hintEn: 'Used to shield from rain and sun'
  },
  {
    id: 'o3',
    mr: 'पतंग',
    en: 'Kite',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'easy',
    aliases: ['kite', 'patang', 'पतंग'],
    hint: 'संक्रांतीला आकाशात मांजाने उडवला जातो',
    hintEn: 'Flown in the sky on Makar Sankranti'
  },
  {
    id: 'o4',
    mr: 'घड्याळ',
    en: 'Clock',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'easy',
    aliases: ['clock', 'watch', 'ghadyal', 'घड्याळ'],
    hint: 'वेळ दाखवणारे काटे असलेले साधन',
    hintEn: 'Has hands that tell the time'
  },
  {
    id: 'o5',
    mr: 'कंदील',
    en: 'Lantern',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'medium',
    aliases: ['lantern', 'kandeel', 'kandil', 'कंदील', 'आकाशकंदील'],
    hint: 'दिवाळीत दारावर लटकवला जाणारा रंगीबेरंगी दिवा',
    hintEn: 'Colorful Diwali lantern hung outside homes'
  },
  {
    id: 'o6',
    mr: 'पुस्तक',
    en: 'Book',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'easy',
    aliases: ['book', 'pustak', 'पुस्तक'],
    hint: 'पाने आणि अक्षरे असलेला ज्ञानाचा साठा',
    hintEn: 'Contains pages with words and stories'
  },
  {
    id: 'o7',
    mr: 'चष्मा',
    en: 'Spectacles',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'easy',
    aliases: ['glasses', 'spectacles', 'chashma', 'chasma', 'चष्मा'],
    hint: 'डोळ्यांवर स्पष्ट दिसण्यासाठी लावला जातो',
    hintEn: 'Worn on the eyes to see clearly'
  },
  {
    id: 'o8',
    mr: 'कुलूप',
    en: 'Lock',
    category: 'वस्तू',
    categoryEn: 'Objects',
    difficulty: 'easy',
    aliases: ['lock', 'kulup', 'कुलूप', 'ताला'],
    hint: 'किल्लीने उघडले जाणारे लोखंडी साधन',
    hintEn: 'Secures doors, opened with a key'
  },
  {
    id: 'o9',
    mr: 'रिक्षा',
    en: 'Auto Rickshaw',
    category: 'वाहन',
    categoryEn: 'Vehicles',
    difficulty: 'easy',
    aliases: ['auto', 'rickshaw', 'riksha', 'रिक्षा', 'ऑटोरिक्षा'],
    hint: 'तीन चाकांची पिवळी-काळी गाडी',
    hintEn: 'Three-wheeled yellow and black cab'
  },
  {
    id: 'o10',
    mr: 'फोन',
    en: 'Mobile Phone',
    category: 'वस्तू',
    categoryEn: 'Gadgets',
    difficulty: 'easy',
    aliases: ['phone', 'mobile', 'cellphone', 'फोन', 'मोबाइल'],
    hint: 'खिशात ठेवून बोलण्याचे व इंटरनेटचे साधन',
    hintEn: 'Pocket touch device for calling and apps'
  },
  {
    id: 'o11',
    mr: 'बॅट',
    en: 'Cricket Bat',
    category: 'खेळ',
    categoryEn: 'Sports',
    difficulty: 'easy',
    aliases: ['bat', 'cricket bat', 'बॅट'],
    hint: 'क्रिकेटच्या खेळात चेंडू मारण्यासाठी वापरतात',
    hintEn: 'Used to hit balls in cricket'
  },
  {
    id: 'o12',
    mr: 'चेंडू',
    en: 'Ball',
    category: 'खेळ',
    categoryEn: 'Sports',
    difficulty: 'easy',
    aliases: ['ball', 'chendu', 'चेंडू', 'बॉल'],
    hint: 'गोल उडणारा खेळण्याचा साधन',
    hintEn: 'Round bouncy toy for games'
  },
  {
    id: 'o13',
    mr: 'कात्री',
    en: 'Scissors',
    category: 'वस्तू',
    categoryEn: 'Tools',
    difficulty: 'easy',
    aliases: ['scissors', 'katri', 'कात्री'],
    hint: 'कागद व कापड कापण्याचे दोन पाते असलेले हत्यार',
    hintEn: 'Two blades joined to cut paper and cloth'
  },
  {
    id: 'o14',
    mr: 'दिवा',
    en: 'Diya',
    category: 'संस्कृती',
    categoryEn: 'Tradition',
    difficulty: 'easy',
    aliases: ['diya', 'lamp', 'diva', 'दिवा', 'पणती'],
    hint: 'मातीची छोटी वात पेटवून प्रकाश देणारी पणती',
    hintEn: 'Clay oil lamp lit during festivals'
  },

  // --- प्राणी आणि पक्षी (Animals & Birds) ---
  {
    id: 'a1',
    mr: 'वाघ',
    en: 'Tiger',
    category: 'प्राणी',
    categoryEn: 'Animals',
    difficulty: 'easy',
    aliases: ['tiger', 'wagh', 'vagh', 'वाघ'],
    hint: 'भारताचा राष्ट्रीय प्राणी, अंगावर काळे पट्टे असतात',
    hintEn: 'National animal of India with black stripes'
  },
  {
    id: 'a2',
    mr: 'सिंह',
    en: 'Lion',
    category: 'प्राणी',
    categoryEn: 'Animals',
    difficulty: 'easy',
    aliases: ['lion', 'sinh', 'सिंह', 'शेर'],
    hint: 'जंगलाचा राजा, गळ्याभोवती आयाळ असते',
    hintEn: 'The King of the Jungle with a majestic mane'
  },
  {
    id: 'a3',
    mr: 'हत्ती',
    en: 'Elephant',
    category: 'प्राणी',
    categoryEn: 'Animals',
    difficulty: 'easy',
    aliases: ['elephant', 'hathi', 'hatti', 'हत्ती'],
    hint: 'लांब सोंड आणि मोठे सुपासारखे कान असलेला प्राणी',
    hintEn: 'Huge creature with a long trunk and big ears'
  },
  {
    id: 'a4',
    mr: 'मोर',
    en: 'Peacock',
    category: 'पक्षी',
    categoryEn: 'Birds',
    difficulty: 'easy',
    aliases: ['peacock', 'mor', 'मोर'],
    hint: 'सुंदर पिसारा फुलवून नाचणारा भारताचा राष्ट्रीय पक्षी',
    hintEn: 'National bird of India that dances in rain'
  },
  {
    id: 'a5',
    mr: 'पोपट',
    en: 'Parrot',
    category: 'पक्षी',
    categoryEn: 'Birds',
    difficulty: 'easy',
    aliases: ['parrot', 'popat', 'पोपट'],
    hint: 'हिरवा रंग आणि लाल चोच असलेला बोलणारा पक्षी',
    hintEn: 'Green bird with a curved red beak'
  },
  {
    id: 'a6',
    mr: 'मांजर',
    en: 'Cat',
    category: 'प्राणी',
    categoryEn: 'Animals',
    difficulty: 'easy',
    aliases: ['cat', 'manjar', 'मांजर', 'बिल्ली'],
    hint: 'म्याऊ म्याऊ करणारा पाळीव प्राणी',
    hintEn: 'Purrs and says meow'
  },
  {
    id: 'a7',
    mr: 'कुत्रा',
    en: 'Dog',
    category: 'प्राणी',
    categoryEn: 'Animals',
    difficulty: 'easy',
    aliases: ['dog', 'kutra', 'कुत्रा'],
    hint: 'इमानदार पाळीव प्राणी, भुंकतो',
    hintEn: 'Loyal human friend that barks'
  },
  {
    id: 'a8',
    mr: 'मासा',
    en: 'Fish',
    category: 'प्राणी',
    categoryEn: 'Animals',
    difficulty: 'easy',
    aliases: ['fish', 'masa', 'मासा', 'मछली'],
    hint: 'पाण्यात पोहणारा कल्ले असलेला जलचर',
    hintEn: 'Swims in water with fins and scales'
  },
  {
    id: 'a9',
    mr: 'फुलपाखरू',
    en: 'Butterfly',
    category: 'कीटक',
    categoryEn: 'Nature',
    difficulty: 'medium',
    aliases: ['butterfly', 'fulpakharu', 'phulpakharu', 'फुलपाखरू'],
    hint: 'फुलांवर बसणारे रंगीबेरंगी पंखांचे कीटक',
    hintEn: 'Colorful winged insect fluttering on flowers'
  },
  {
    id: 'a10',
    mr: 'बेडूक',
    en: 'Frog',
    category: 'प्राणी',
    categoryEn: 'Animals',
    difficulty: 'easy',
    aliases: ['frog', 'beduk', 'बेडूक'],
    hint: 'पावसात डरांव डरांव करणारा उड्या मारणारा प्राणी',
    hintEn: 'Croaks and hops near water in rain'
  },

  // --- निसर्ग आणि खगोल (Nature & Sky) ---
  {
    id: 'n1',
    mr: 'सूर्य',
    en: 'Sun',
    category: 'निसर्ग',
    categoryEn: 'Nature',
    difficulty: 'easy',
    aliases: ['sun', 'surya', 'सूर्य', 'सूरज'],
    hint: 'सकाळी उगवणारा पिवळा तप्त तारा',
    hintEn: 'Bright yellow star that lights up day'
  },
  {
    id: 'n2',
    mr: 'चंद्र',
    en: 'Moon',
    category: 'निसर्ग',
    categoryEn: 'Nature',
    difficulty: 'easy',
    aliases: ['moon', 'chandra', 'चंद्र', 'चांद'],
    hint: 'रात्री आकाशात चमकणारा शीतल उपग्रह',
    hintEn: 'Glows in the night sky and changes shapes'
  },
  {
    id: 'n3',
    mr: 'झाड',
    en: 'Tree',
    category: 'निसर्ग',
    categoryEn: 'Nature',
    difficulty: 'easy',
    aliases: ['tree', 'zhad', 'jhad', 'झाड', 'वृक्ष'],
    hint: 'खोद, फांद्या आणि हिरवी पाने असणारा वनस्पती',
    hintEn: 'Has a trunk, branches, and green leaves'
  },
  {
    id: 'n4',
    mr: 'पाऊस',
    en: 'Rain',
    category: 'निसर्ग',
    categoryEn: 'Nature',
    difficulty: 'easy',
    aliases: ['rain', 'paus', 'पाऊस', 'बारिश'],
    hint: 'आकाशातून पडणारे पाण्याचे थेंब',
    hintEn: 'Water droplets falling from sky'
  },
  {
    id: 'n5',
    mr: 'इंद्रधनुष्य',
    en: 'Rainbow',
    category: 'निसर्ग',
    categoryEn: 'Nature',
    difficulty: 'medium',
    aliases: ['rainbow', 'indradhanushya', 'इंद्रधनुष्य'],
    hint: 'पावसानंतर आकाशात दिसणारे सात रंगांचे कमान',
    hintEn: 'Seven-colored arc across the sky'
  },
  {
    id: 'n6',
    mr: 'पर्वत',
    en: 'Mountain',
    category: 'निसर्ग',
    categoryEn: 'Nature',
    difficulty: 'easy',
    aliases: ['mountain', 'parvat', 'पर्वत', 'पहाड'],
    hint: 'उंच त्रिकोणी आकाराचा दगडी भूभाग',
    hintEn: 'Tall peak of rock reaching into the sky'
  },
  {
    id: 'n7',
    mr: 'नदी',
    en: 'River',
    category: 'निसर्ग',
    categoryEn: 'Nature',
    difficulty: 'easy',
    aliases: ['river', 'nadi', 'नदी'],
    hint: 'पर्वतातून समुद्राकडे वाहणारा पाण्याचा प्रवाह',
    hintEn: 'Flowing body of fresh water'
  },
  {
    id: 'n8',
    mr: 'तारा',
    en: 'Star',
    category: 'निसर्ग',
    categoryEn: 'Sky',
    difficulty: 'easy',
    aliases: ['star', 'tara', 'तारा', 'चांदणी'],
    hint: 'रात्री आकाशात लुकलुकणारा प्रकाशबिंदू',
    hintEn: 'Twinkles in the dark night sky'
  },

  // --- संस्कृती, वाद्ये व सण (Culture, Music & Festivals) ---
  {
    id: 'c1',
    mr: 'किल्ला',
    en: 'Fort',
    category: 'संस्कृती',
    categoryEn: 'Culture',
    difficulty: 'medium',
    aliases: ['fort', 'killa', 'kille', 'किल्ला'],
    hint: 'छत्रपती शिवाजी महाराजांनी जिंकलेली ऐतिहासिक वास्तू',
    hintEn: 'Historic stone fortress built on hills'
  },
  {
    id: 'c2',
    mr: 'ढोलकी',
    en: 'Dholki',
    category: 'वाद्य',
    categoryEn: 'Instruments',
    difficulty: 'medium',
    aliases: ['dholki', 'dholak', 'ढोलकी', 'ढोलक'],
    hint: 'लावणी आणि भजनात दोन्ही हातांनी वाजवले जाणारे लाकडी वाद्य',
    hintEn: 'Two-headed Indian drum played in Lavani'
  },
  {
    id: 'c3',
    mr: 'तबला',
    en: 'Tabla',
    category: 'वाद्य',
    categoryEn: 'Instruments',
    difficulty: 'medium',
    aliases: ['tabla', 'तबला'],
    hint: 'शास्त्रीय संगीतातील दोन ड्रमची जोडी',
    hintEn: 'Pair of small hand drums for classical music'
  },
  {
    id: 'c4',
    mr: 'तुतारी',
    en: 'Tutari',
    category: 'वाद्य',
    categoryEn: 'Instruments',
    difficulty: 'medium',
    aliases: ['tutari', 'तुतारी'],
    hint: 'वक्र आकाराचे पितळी फुंकण्याचे वाद्य',
    hintEn: 'Curved horn instrument blown in welcome'
  },
  {
    id: 'c5',
    mr: 'रांगोळी',
    en: 'Rangoli',
    category: 'संस्कृती',
    categoryEn: 'Art',
    difficulty: 'medium',
    aliases: ['rangoli', 'रांगोळी'],
    hint: 'दारापुढे काढली जाणारी रंगीत नक्षी',
    hintEn: 'Colorful floor art drawn at doorsteps'
  },
  {
    id: 'c6',
    mr: 'फेटा',
    en: 'Pheta',
    category: 'संस्कृती',
    categoryEn: 'Tradition',
    difficulty: 'medium',
    aliases: ['pheta', 'pagadi', 'फेटा', 'पगडी', 'turban'],
    hint: 'डोक्यावर बांधला जाणारा पारंपारिक राजेशाही रुमाल',
    hintEn: 'Traditional royal Marathi turban headgear'
  },
  {
    id: 'c7',
    mr: 'मंदिर',
    en: 'Temple',
    category: 'संस्कृती',
    categoryEn: 'Places',
    difficulty: 'easy',
    aliases: ['temple', 'mandir', 'मंदिर'],
    hint: 'कळस व घंटा असलेले देवाचे पवित्र ठिकाण',
    hintEn: 'Place of worship with a spire and bell'
  },

  // --- व्यवसाय आणि व्यक्ती (Professions & Roles) ---
  {
    id: 'p1',
    mr: 'शेतकरी',
    en: 'Farmer',
    category: 'व्यक्ती',
    categoryEn: 'People',
    difficulty: 'medium',
    aliases: ['farmer', 'shetkari', 'शेतकरी', 'किसान'],
    hint: 'नांगराने शेतात धान्य पिकवणारा जगाचा पोशिंदा',
    hintEn: 'Grows crops in fields with a plow'
  },
  {
    id: 'p2',
    mr: 'पोलीस',
    en: 'Police',
    category: 'व्यक्ती',
    categoryEn: 'People',
    difficulty: 'easy',
    aliases: ['police', 'cop', 'पोलीस'],
    hint: 'खाकी कपडे व टोपी घालून गुन्हेगारांना पकडणारा रक्षक',
    hintEn: 'Wears khaki uniform and protects citizens'
  },
  {
    id: 'p3',
    mr: 'डॉक्टर',
    en: 'Doctor',
    category: 'व्यक्ती',
    categoryEn: 'People',
    difficulty: 'easy',
    aliases: ['doctor', 'dr', 'डॉक्टर', 'वैद्य'],
    hint: 'स्टेथॉस्कोप लावून आजारी लोकांवर उपचार करणारा',
    hintEn: 'Heals patients and wears a stethoscope'
  },
  {
    id: 'p4',
    mr: 'जादूगार',
    en: 'Magician',
    category: 'व्यक्ती',
    categoryEn: 'People',
    difficulty: 'medium',
    aliases: ['magician', 'jadugar', 'जादूगार'],
    hint: 'काठी फिरवून टोपलीतून ससा काढणारा कलावंत',
    hintEn: 'Performs tricks with a wand and top hat'
  },
  {
    id: 'p5',
    mr: 'राजा',
    en: 'King',
    category: 'व्यक्ती',
    categoryEn: 'People',
    difficulty: 'easy',
    aliases: ['king', 'raja', 'राजा'],
    hint: 'मुकुट घालून सिंहासनावर बसणारा राज्यकर्ता',
    hintEn: 'Wears a golden crown and sits on a throne'
  }
];

/**
 * Clean & normalize a string for fuzzy matching
 */
function clean(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\s\-_.,!?'"‘’“”]/g, '')
    // Normalize common devanagari variants
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Fast Levenshtein distance for close-guess feedback
 */
function levenshtein(a, b) {
  const al = a.length;
  const bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const row = [];
  for (let i = 0; i <= bl; i++) row[i] = i;
  for (let i = 1; i <= al; i++) {
    let prev = i;
    for (let j = 1; j <= bl; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[bl] = prev;
  }
  return row[bl];
}

/**
 * Check if player guess is exact match (Marathi, English, or alias)
 */
function isMatch(guess, word) {
  if (!guess || !word) return false;
  const cGuess = clean(guess);
  if (!cGuess) return false;

  const targets = [word.mr, word.en, ...(word.aliases || [])];
  for (const t of targets) {
    if (clean(t) === cGuess) return true;
  }
  return false;
}

/**
 * Check if player guess is very close (e.g. 1-2 typos)
 */
function isClose(guess, word) {
  if (!guess || !word) return false;
  if (isMatch(guess, word)) return false; // Exact match is not "close"
  const cGuess = clean(guess);
  if (cGuess.length < 3) return false;

  const targets = [word.mr, word.en, ...(word.aliases || [])];
  for (const t of targets) {
    const cTarget = clean(t);
    const dist = levenshtein(cGuess, cTarget);
    if (dist > 0 && dist <= (cTarget.length > 5 ? 2 : 1)) {
      return true;
    }
  }
  return false;
}

/**
 * Pick random words for drawer selection (1 easy, 1 medium/any, 1 fun)
 */
function getRandomChoices(count = 3, category = 'all') {
  let pool = WORDS;
  if (category && category !== 'all') {
    const filtered = WORDS.filter(w => w.category === category || w.categoryEn.toLowerCase() === category.toLowerCase());
    if (filtered.length >= count) pool = filtered;
  }
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Split Marathi/Devanagari text into natural grapheme clusters (syllables)
 */
function getGraphemeClusters(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('mr', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), s => s.segment);
  }
  // Fallback regex for Devanagari graphemes
  return text.match(/[\u0900-\u097F][\u0901-\u0903\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963]*|[^\u0900-\u097F]/g) || text.split('');
}

/**
 * Mask word for guessers (revealing letters at given indices or intervals)
 */
function maskWord(word, revealRatio = 0, lang = 'mr') {
  const text = lang === 'en' ? word.en : word.mr;
  const clusters = getGraphemeClusters(text);
  const total = clusters.length;

  if (revealRatio <= 0) {
    return {
      masked: clusters.map(c => (c.trim() === '' ? ' ' : '_')).join(' '),
      letterCount: total,
      rawLength: text.length
    };
  }

  const numToReveal = Math.min(total - 1, Math.max(1, Math.floor(total * revealRatio)));
  // Deterministic reveal based on word id
  const revealIndices = new Set();
  let step = Math.max(1, Math.floor(total / (numToReveal + 1)));
  for (let i = 0; i < total && revealIndices.size < numToReveal; i += step) {
    if (clusters[i].trim() !== '') revealIndices.add(i);
  }

  const masked = clusters.map((c, idx) => {
    if (c.trim() === '') return ' ';
    if (revealIndices.has(idx)) return c;
    return '_';
  }).join(' ');

  return {
    masked,
    letterCount: total,
    rawLength: text.length
  };
}

module.exports = {
  WORDS,
  clean,
  levenshtein,
  isMatch,
  isClose,
  getRandomChoices,
  getGraphemeClusters,
  maskWord
};
