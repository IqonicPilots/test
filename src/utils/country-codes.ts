/**
 * Country Code Data
 * A comprehensive list of countries with their codes, dialing codes, and flags
 */

export interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2 code
  code3: string; // ISO 3166-1 alpha-3 code
  dialCode: string; // International dialing code
  flag: string; // Emoji flag
  priority?: number; // For sorting frequently used countries first
}

export const COUNTRIES: Country[] = [
  {
    name: 'United States',
    code: 'US',
    code3: 'USA',
    dialCode: '+1',
    flag: '🇺🇸',
    priority: 1,
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    code3: 'GBR',
    dialCode: '+44',
    flag: '🇬🇧',
    priority: 2,
  },
  {
    name: 'Canada',
    code: 'CA',
    code3: 'CAN',
    dialCode: '+1',
    flag: '🇨🇦',
    priority: 3,
  },
  {
    name: 'Australia',
    code: 'AU',
    code3: 'AUS',
    dialCode: '+61',
    flag: '🇦🇺',
    priority: 4,
  },
  {
    name: 'India',
    code: 'IN',
    code3: 'IND',
    dialCode: '+91',
    flag: '🇮🇳',
    priority: 5,
  },
  {
    name: 'Germany',
    code: 'DE',
    code3: 'DEU',
    dialCode: '+49',
    flag: '🇩🇪',
  },
  {
    name: 'France',
    code: 'FR',
    code3: 'FRA',
    dialCode: '+33',
    flag: '🇫🇷',
  },
  {
    name: 'Italy',
    code: 'IT',
    code3: 'ITA',
    dialCode: '+39',
    flag: '🇮🇹',
  },
  {
    name: 'Spain',
    code: 'ES',
    code3: 'ESP',
    dialCode: '+34',
    flag: '🇪🇸',
  },
  {
    name: 'Netherlands',
    code: 'NL',
    code3: 'NLD',
    dialCode: '+31',
    flag: '🇳🇱',
  },
  {
    name: 'Brazil',
    code: 'BR',
    code3: 'BRA',
    dialCode: '+55',
    flag: '🇧🇷',
  },
  {
    name: 'Mexico',
    code: 'MX',
    code3: 'MEX',
    dialCode: '+52',
    flag: '🇲🇽',
  },
  {
    name: 'Japan',
    code: 'JP',
    code3: 'JPN',
    dialCode: '+81',
    flag: '🇯🇵',
  },
  {
    name: 'China',
    code: 'CN',
    code3: 'CHN',
    dialCode: '+86',
    flag: '🇨🇳',
  },
  {
    name: 'South Korea',
    code: 'KR',
    code3: 'KOR',
    dialCode: '+82',
    flag: '🇰🇷',
  },
  {
    name: 'Singapore',
    code: 'SG',
    code3: 'SGP',
    dialCode: '+65',
    flag: '🇸🇬',
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    code3: 'ARE',
    dialCode: '+971',
    flag: '🇦🇪',
  },
  {
    name: 'Saudi Arabia',
    code: 'SA',
    code3: 'SAU',
    dialCode: '+966',
    flag: '🇸🇦',
  },
  {
    name: 'South Africa',
    code: 'ZA',
    code3: 'ZAF',
    dialCode: '+27',
    flag: '🇿🇦',
  },
  {
    name: 'Nigeria',
    code: 'NG',
    code3: 'NGA',
    dialCode: '+234',
    flag: '🇳🇬',
  },
  {
    name: 'Kenya',
    code: 'KE',
    code3: 'KEN',
    dialCode: '+254',
    flag: '🇰🇪',
  },
  {
    name: 'Egypt',
    code: 'EG',
    code3: 'EGY',
    dialCode: '+20',
    flag: '🇪🇬',
  },
  {
    name: 'Turkey',
    code: 'TR',
    code3: 'TUR',
    dialCode: '+90',
    flag: '🇹🇷',
  },
  {
    name: 'Russia',
    code: 'RU',
    code3: 'RUS',
    dialCode: '+7',
    flag: '🇷🇺',
  },
  {
    name: 'Poland',
    code: 'PL',
    code3: 'POL',
    dialCode: '+48',
    flag: '🇵🇱',
  },
  {
    name: 'Sweden',
    code: 'SE',
    code3: 'SWE',
    dialCode: '+46',
    flag: '🇸🇪',
  },
  {
    name: 'Norway',
    code: 'NO',
    code3: 'NOR',
    dialCode: '+47',
    flag: '🇳🇴',
  },
  {
    name: 'Denmark',
    code: 'DK',
    code3: 'DNK',
    dialCode: '+45',
    flag: '🇩🇰',
  },
  {
    name: 'Finland',
    code: 'FI',
    code3: 'FIN',
    dialCode: '+358',
    flag: '🇫🇮',
  },
  {
    name: 'Switzerland',
    code: 'CH',
    code3: 'CHE',
    dialCode: '+41',
    flag: '🇨🇭',
  },
  {
    name: 'Austria',
    code: 'AT',
    code3: 'AUT',
    dialCode: '+43',
    flag: '🇦🇹',
  },
  {
    name: 'Belgium',
    code: 'BE',
    code3: 'BEL',
    dialCode: '+32',
    flag: '🇧🇪',
  },
  {
    name: 'Portugal',
    code: 'PT',
    code3: 'PRT',
    dialCode: '+351',
    flag: '🇵🇹',
  },
  {
    name: 'Greece',
    code: 'GR',
    code3: 'GRC',
    dialCode: '+30',
    flag: '🇬🇷',
  },
  {
    name: 'Ireland',
    code: 'IE',
    code3: 'IRL',
    dialCode: '+353',
    flag: '🇮🇪',
  },
  {
    name: 'New Zealand',
    code: 'NZ',
    code3: 'NZL',
    dialCode: '+64',
    flag: '🇳🇿',
  },
  {
    name: 'Argentina',
    code: 'AR',
    code3: 'ARG',
    dialCode: '+54',
    flag: '🇦🇷',
  },
  {
    name: 'Chile',
    code: 'CL',
    code3: 'CHL',
    dialCode: '+56',
    flag: '🇨🇱',
  },
  {
    name: 'Colombia',
    code: 'CO',
    code3: 'COL',
    dialCode: '+57',
    flag: '🇨🇴',
  },
  {
    name: 'Peru',
    code: 'PE',
    code3: 'PER',
    dialCode: '+51',
    flag: '🇵🇪',
  },
  {
    name: 'Venezuela',
    code: 'VE',
    code3: 'VEN',
    dialCode: '+58',
    flag: '🇻🇪',
  },
  {
    name: 'Indonesia',
    code: 'ID',
    code3: 'IDN',
    dialCode: '+62',
    flag: '🇮🇩',
  },
  {
    name: 'Malaysia',
    code: 'MY',
    code3: 'MYS',
    dialCode: '+60',
    flag: '🇲🇾',
  },
  {
    name: 'Thailand',
    code: 'TH',
    code3: 'THA',
    dialCode: '+66',
    flag: '🇹🇭',
  },
  {
    name: 'Vietnam',
    code: 'VN',
    code3: 'VNM',
    dialCode: '+84',
    flag: '🇻🇳',
  },
  {
    name: 'Philippines',
    code: 'PH',
    code3: 'PHL',
    dialCode: '+63',
    flag: '🇵🇭',
  },
  {
    name: 'Pakistan',
    code: 'PK',
    code3: 'PAK',
    dialCode: '+92',
    flag: '🇵🇰',
  },
  {
    name: 'Bangladesh',
    code: 'BD',
    code3: 'BGD',
    dialCode: '+880',
    flag: '🇧🇩',
  },
  {
    name: 'Israel',
    code: 'IL',
    code3: 'ISR',
    dialCode: '+972',
    flag: '🇮🇱',
  },
  {
    name: 'Qatar',
    code: 'QA',
    code3: 'QAT',
    dialCode: '+974',
    flag: '🇶🇦',
  },
  {
    name: 'Kuwait',
    code: 'KW',
    code3: 'KWT',
    dialCode: '+965',
    flag: '🇰🇼',
  },
  {
    name: 'Bahrain',
    code: 'BH',
    code3: 'BHR',
    dialCode: '+973',
    flag: '🇧🇭',
  },
  {
    name: 'Oman',
    code: 'OM',
    code3: 'OMN',
    dialCode: '+968',
    flag: '🇴🇲',
  },
  {
    name: 'Jordan',
    code: 'JO',
    code3: 'JOR',
    dialCode: '+962',
    flag: '🇯🇴',
  },
  {
    name: 'Lebanon',
    code: 'LB',
    code3: 'LBN',
    dialCode: '+961',
    flag: '🇱🇧',
  },
  {
    name: 'Iraq',
    code: 'IQ',
    code3: 'IRQ',
    dialCode: '+964',
    flag: '🇮🇶',
  },
  {
    name: 'Iran',
    code: 'IR',
    code3: 'IRN',
    dialCode: '+98',
    flag: '🇮🇷',
  },
  {
    name: 'Afghanistan',
    code: 'AF',
    code3: 'AFG',
    dialCode: '+93',
    flag: '🇦🇫',
  },
  {
    name: 'Ukraine',
    code: 'UA',
    code3: 'UKR',
    dialCode: '+380',
    flag: '🇺🇦',
  },
  {
    name: 'Czech Republic',
    code: 'CZ',
    code3: 'CZE',
    dialCode: '+420',
    flag: '🇨🇿',
  },
  {
    name: 'Romania',
    code: 'RO',
    code3: 'ROU',
    dialCode: '+40',
    flag: '🇷🇴',
  },
  {
    name: 'Hungary',
    code: 'HU',
    code3: 'HUN',
    dialCode: '+36',
    flag: '🇭🇺',
  },
  {
    name: 'Morocco',
    code: 'MA',
    code3: 'MAR',
    dialCode: '+212',
    flag: '🇲🇦',
  },
  {
    name: 'Algeria',
    code: 'DZ',
    code3: 'DZA',
    dialCode: '+213',
    flag: '🇩🇿',
  },
  {
    name: 'Tunisia',
    code: 'TN',
    code3: 'TUN',
    dialCode: '+216',
    flag: '🇹🇳',
  },
  {
    name: 'Libya',
    code: 'LY',
    code3: 'LBY',
    dialCode: '+218',
    flag: '🇱🇾',
  },
  {
    name: 'Ghana',
    code: 'GH',
    code3: 'GHA',
    dialCode: '+233',
    flag: '🇬🇭',
  },
  {
    name: 'Ethiopia',
    code: 'ET',
    code3: 'ETH',
    dialCode: '+251',
    flag: '🇪🇹',
  },
  {
    name: 'Tanzania',
    code: 'TZ',
    code3: 'TZA',
    dialCode: '+255',
    flag: '🇹🇿',
  },
  {
    name: 'Uganda',
    code: 'UG',
    code3: 'UGA',
    dialCode: '+256',
    flag: '🇺🇬',
  },
  {
    name: 'Rwanda',
    code: 'RW',
    code3: 'RWA',
    dialCode: '+250',
    flag: '🇷🇼',
  },
  {
    name: 'Zimbabwe',
    code: 'ZW',
    code3: 'ZWE',
    dialCode: '+263',
    flag: '🇿🇼',
  },
  {
    name: 'Botswana',
    code: 'BW',
    code3: 'BWA',
    dialCode: '+267',
    flag: '🇧🇼',
  },
  {
    name: 'Namibia',
    code: 'NA',
    code3: 'NAM',
    dialCode: '+264',
    flag: '🇳🇦',
  },
  {
    name: 'Zambia',
    code: 'ZM',
    code3: 'ZMB',
    dialCode: '+260',
    flag: '🇿🇲',
  },
  {
    name: 'Malawi',
    code: 'MW',
    code3: 'MWI',
    dialCode: '+265',
    flag: '🇲🇼',
  },
  {
    name: 'Mozambique',
    code: 'MZ',
    code3: 'MOZ',
    dialCode: '+258',
    flag: '🇲🇿',
  },
  {
    name: 'Angola',
    code: 'AO',
    code3: 'AGO',
    dialCode: '+244',
    flag: '🇦🇴',
  },
  {
    name: 'Senegal',
    code: 'SN',
    code3: 'SEN',
    dialCode: '+221',
    flag: '🇸🇳',
  },
  {
    name: 'Cameroon',
    code: 'CM',
    code3: 'CMR',
    dialCode: '+237',
    flag: '🇨🇲',
  },
  {
    name: 'Ivory Coast',
    code: 'CI',
    code3: 'CIV',
    dialCode: '+225',
    flag: '🇨🇮',
  },
  {
    name: 'Mali',
    code: 'ML',
    code3: 'MLI',
    dialCode: '+223',
    flag: '🇲🇱',
  },
  {
    name: 'Burkina Faso',
    code: 'BF',
    code3: 'BFA',
    dialCode: '+226',
    flag: '🇧🇫',
  },
  {
    name: 'Niger',
    code: 'NE',
    code3: 'NER',
    dialCode: '+227',
    flag: '🇳🇪',
  },
  {
    name: 'Chad',
    code: 'TD',
    code3: 'TCD',
    dialCode: '+235',
    flag: '🇹🇩',
  },
  {
    name: 'Gabon',
    code: 'GA',
    code3: 'GAB',
    dialCode: '+241',
    flag: '🇬🇦',
  },
  {
    name: 'Equatorial Guinea',
    code: 'GQ',
    code3: 'GNQ',
    dialCode: '+240',
    flag: '🇬🇶',
  },
  {
    name: 'Republic of the Congo',
    code: 'CG',
    code3: 'COG',
    dialCode: '+242',
    flag: '🇨🇬',
  },
  {
    name: 'Democratic Republic of the Congo',
    code: 'CD',
    code3: 'COD',
    dialCode: '+243',
    flag: '🇨🇩',
  },
  {
    name: 'Central African Republic',
    code: 'CF',
    code3: 'CAF',
    dialCode: '+236',
    flag: '🇨🇫',
  },
  {
    name: 'Madagascar',
    code: 'MG',
    code3: 'MDG',
    dialCode: '+261',
    flag: '🇲🇬',
  },
  {
    name: 'Mauritius',
    code: 'MU',
    code3: 'MUS',
    dialCode: '+230',
    flag: '🇲🇺',
  },
  {
    name: 'Seychelles',
    code: 'SC',
    code3: 'SYC',
    dialCode: '+248',
    flag: '🇸🇨',
  },
  {
    name: 'Reunion',
    code: 'RE',
    code3: 'REU',
    dialCode: '+262',
    flag: '🇷🇪',
  },
  {
    name: 'Mayotte',
    code: 'YT',
    code3: 'MYT',
    dialCode: '+262',
    flag: '🇾🇹',
  },
  {
    name: 'Comoros',
    code: 'KM',
    code3: 'COM',
    dialCode: '+269',
    flag: '🇰🇲',
  },
  {
    name: 'Djibouti',
    code: 'DJ',
    code3: 'DJI',
    dialCode: '+253',
    flag: '🇩🇯',
  },
  {
    name: 'Somalia',
    code: 'SO',
    code3: 'SOM',
    dialCode: '+252',
    flag: '🇸🇴',
  },
  {
    name: 'Eritrea',
    code: 'ER',
    code3: 'ERI',
    dialCode: '+291',
    flag: '🇪🇷',
  },
  {
    name: 'Sudan',
    code: 'SD',
    code3: 'SDN',
    dialCode: '+249',
    flag: '🇸🇩',
  },
  {
    name: 'South Sudan',
    code: 'SS',
    code3: 'SSD',
    dialCode: '+211',
    flag: '🇸🇸',
  },
  {
    name: 'Uzbekistan',
    code: 'UZ',
    code3: 'UZB',
    dialCode: '+998',
    flag: '🇺🇿',
  },
  {
    name: 'Kazakhstan',
    code: 'KZ',
    code3: 'KAZ',
    dialCode: '+7',
    flag: '🇰🇿',
  },
  {
    name: 'Turkmenistan',
    code: 'TM',
    code3: 'TKM',
    dialCode: '+993',
    flag: '🇹🇲',
  },
  {
    name: 'Kyrgyzstan',
    code: 'KG',
    code3: 'KGZ',
    dialCode: '+996',
    flag: '🇰🇬',
  },
  {
    name: 'Tajikistan',
    code: 'TJ',
    code3: 'TJK',
    dialCode: '+992',
    flag: '🇹🇯',
  },
  {
    name: 'Azerbaijan',
    code: 'AZ',
    code3: 'AZE',
    dialCode: '+994',
    flag: '🇦🇿',
  },
  {
    name: 'Armenia',
    code: 'AM',
    code3: 'ARM',
    dialCode: '+374',
    flag: '🇦🇲',
  },
  {
    name: 'Georgia',
    code: 'GE',
    code3: 'GEO',
    dialCode: '+995',
    flag: '🇬🇪',
  },
  {
    name: 'Belarus',
    code: 'BY',
    code3: 'BLR',
    dialCode: '+375',
    flag: '🇧🇾',
  },
  {
    name: 'Moldova',
    code: 'MD',
    code3: 'MDA',
    dialCode: '+373',
    flag: '🇲🇩',
  },
  {
    name: 'Lithuania',
    code: 'LT',
    code3: 'LTU',
    dialCode: '+370',
    flag: '🇱🇹',
  },
  {
    name: 'Latvia',
    code: 'LV',
    code3: 'LVA',
    dialCode: '+371',
    flag: '🇱🇻',
  },
  {
    name: 'Estonia',
    code: 'EE',
    code3: 'EST',
    dialCode: '+372',
    flag: '🇪🇪',
  },
  {
    name: 'Iceland',
    code: 'IS',
    code3: 'ISL',
    dialCode: '+354',
    flag: '🇮🇸',
  },
  {
    name: 'Luxembourg',
    code: 'LU',
    code3: 'LUX',
    dialCode: '+352',
    flag: '🇱🇺',
  },
  {
    name: 'Malta',
    code: 'MT',
    code3: 'MLT',
    dialCode: '+356',
    flag: '🇲🇹',
  },
  {
    name: 'Cyprus',
    code: 'CY',
    code3: 'CYP',
    dialCode: '+357',
    flag: '🇨🇾',
  },
  {
    name: 'Monaco',
    code: 'MC',
    code3: 'MCO',
    dialCode: '+377',
    flag: '🇲🇨',
  },
  {
    name: 'San Marino',
    code: 'SM',
    code3: 'SMR',
    dialCode: '+378',
    flag: '🇸🇲',
  },
  {
    name: 'Vatican City',
    code: 'VA',
    code3: 'VAT',
    dialCode: '+379',
    flag: '🇻🇦',
  },
  {
    name: 'Andorra',
    code: 'AD',
    code3: 'AND',
    dialCode: '+376',
    flag: '🇦🇩',
  },
  {
    name: 'Liechtenstein',
    code: 'LI',
    code3: 'LIE',
    dialCode: '+423',
    flag: '🇱🇮',
  },
  {
    name: 'Gibraltar',
    code: 'GI',
    code3: 'GIB',
    dialCode: '+350',
    flag: '🇬🇮',
  },
  {
    name: 'Faroe Islands',
    code: 'FO',
    code3: 'FRO',
    dialCode: '+298',
    flag: '🇫🇴',
  },
  {
    name: 'Greenland',
    code: 'GL',
    code3: 'GRL',
    dialCode: '+299',
    flag: '🇬🇱',
  },
  {
    name: 'Bermuda',
    code: 'BM',
    code3: 'BMU',
    dialCode: '+1',
    flag: '🇧🇲',
  },
  {
    name: 'Puerto Rico',
    code: 'PR',
    code3: 'PRI',
    dialCode: '+1',
    flag: '🇵🇷',
  },
  {
    name: 'Jamaica',
    code: 'JM',
    code3: 'JAM',
    dialCode: '+1',
    flag: '🇯🇲',
  },
  {
    name: 'Trinidad and Tobago',
    code: 'TT',
    code3: 'TTO',
    dialCode: '+1',
    flag: '🇹🇹',
  },
  {
    name: 'Bahamas',
    code: 'BS',
    code3: 'BHS',
    dialCode: '+1',
    flag: '🇧🇸',
  },
  {
    name: 'Barbados',
    code: 'BB',
    code3: 'BRB',
    dialCode: '+1',
    flag: '🇧🇧',
  },
  {
    name: 'Guyana',
    code: 'GY',
    code3: 'GUY',
    dialCode: '+592',
    flag: '🇬🇾',
  },
  {
    name: 'Suriname',
    code: 'SR',
    code3: 'SUR',
    dialCode: '+597',
    flag: '🇸🇷',
  },
  {
    name: 'French Guiana',
    code: 'GF',
    code3: 'GUF',
    dialCode: '+594',
    flag: '🇬🇫',
  },
  {
    name: 'Uruguay',
    code: 'UY',
    code3: 'URY',
    dialCode: '+598',
    flag: '🇺🇾',
  },
  {
    name: 'Paraguay',
    code: 'PY',
    code3: 'PRY',
    dialCode: '+595',
    flag: '🇵🇾',
  },
  {
    name: 'Bolivia',
    code: 'BO',
    code3: 'BOL',
    dialCode: '+591',
    flag: '🇧🇴',
  },
  {
    name: 'Ecuador',
    code: 'EC',
    code3: 'ECU',
    dialCode: '+593',
    flag: '🇪🇨',
  },
  {
    name: 'Costa Rica',
    code: 'CR',
    code3: 'CRI',
    dialCode: '+506',
    flag: '🇨🇷',
  },
  {
    name: 'Panama',
    code: 'PA',
    code3: 'PAN',
    dialCode: '+507',
    flag: '🇵🇦',
  },
  {
    name: 'Nicaragua',
    code: 'NI',
    code3: 'NIC',
    dialCode: '+505',
    flag: '🇳🇮',
  },
  {
    name: 'Honduras',
    code: 'HN',
    code3: 'HND',
    dialCode: '+504',
    flag: '🇭🇳',
  },
  {
    name: 'El Salvador',
    code: 'SV',
    code3: 'SLV',
    dialCode: '+503',
    flag: '🇸🇻',
  },
  {
    name: 'Guatemala',
    code: 'GT',
    code3: 'GTM',
    dialCode: '+502',
    flag: '🇬🇹',
  },
  {
    name: 'Belize',
    code: 'BZ',
    code3: 'BLZ',
    dialCode: '+501',
    flag: '🇧🇿',
  },
  {
    name: 'Cuba',
    code: 'CU',
    code3: 'CUB',
    dialCode: '+53',
    flag: '🇨🇺',
  },
  {
    name: 'Haiti',
    code: 'HT',
    code3: 'HTI',
    dialCode: '+509',
    flag: '🇭🇹',
  },
  {
    name: 'Dominican Republic',
    code: 'DO',
    code3: 'DOM',
    dialCode: '+1',
    flag: '🇩🇴',
  },
  {
    name: 'Saint Lucia',
    code: 'LC',
    code3: 'LCA',
    dialCode: '+1',
    flag: '🇱🇨',
  },
  {
    name: 'Grenada',
    code: 'GD',
    code3: 'GRD',
    dialCode: '+1',
    flag: '🇬🇩',
  },
  {
    name: 'Saint Vincent and the Grenadines',
    code: 'VC',
    code3: 'VCT',
    dialCode: '+1',
    flag: '🇻🇨',
  },
  {
    name: 'Antigua and Barbuda',
    code: 'AG',
    code3: 'ATG',
    dialCode: '+1',
    flag: '🇦🇬',
  },
  {
    name: 'Dominica',
    code: 'DM',
    code3: 'DMA',
    dialCode: '+1',
    flag: '🇩🇲',
  },
  {
    name: 'Montserrat',
    code: 'MS',
    code3: 'MSR',
    dialCode: '+1',
    flag: '🇲🇸',
  },
  {
    name: 'Martinique',
    code: 'MQ',
    code3: 'MTQ',
    dialCode: '+596',
    flag: '🇲🇶',
  },
  {
    name: 'Guadeloupe',
    code: 'GP',
    code3: 'GLP',
    dialCode: '+590',
    flag: '🇬🇵',
  },
  {
    name: 'Aruba',
    code: 'AW',
    code3: 'ABW',
    dialCode: '+297',
    flag: '🇦🇼',
  },
  {
    name: 'Curacao',
    code: 'CW',
    code3: 'CUW',
    dialCode: '+599',
    flag: '🇨🇼',
  },
  {
    name: 'Sint Maarten',
    code: 'SX',
    code3: 'SXM',
    dialCode: '+1',
    flag: '🇸🇽',
  },
  {
    name: 'Bonaire',
    code: 'BQ',
    code3: 'BES',
    dialCode: '+599',
    flag: '🇧🇶',
  },
  {
    name: 'Cayman Islands',
    code: 'KY',
    code3: 'CYM',
    dialCode: '+1',
    flag: '🇰🇾',
  },
  {
    name: 'British Virgin Islands',
    code: 'VG',
    code3: 'VGB',
    dialCode: '+1',
    flag: '🇻🇬',
  },
  {
    name: 'United States Virgin Islands',
    code: 'VI',
    code3: 'VIR',
    dialCode: '+1',
    flag: '🇻🇮',
  },
  {
    name: 'Anguilla',
    code: 'AI',
    code3: 'AIA',
    dialCode: '+1',
    flag: '🇦🇮',
  },
  {
    name: 'Saint Kitts and Nevis',
    code: 'KN',
    code3: 'KNA',
    dialCode: '+1',
    flag: '🇰🇳',
  },
  {
    name: 'Turks and Caicos Islands',
    code: 'TC',
    code3: 'TCA',
    dialCode: '+1',
    flag: '🇹🇨',
  },
  {
    name: 'Falkland Islands',
    code: 'FK',
    code3: 'FLK',
    dialCode: '+500',
    flag: '🇫🇰',
  },
  {
    name: 'South Georgia and the South Sandwich Islands',
    code: 'GS',
    code3: 'SGS',
    dialCode: '+500',
    flag: '🇬🇸',
  },
  {
    name: 'Saint Helena',
    code: 'SH',
    code3: 'SHN',
    dialCode: '+290',
    flag: '🇸🇭',
  },
  {
    name: 'Ascension Island',
    code: 'AC',
    code3: 'ASC',
    dialCode: '+247',
    flag: '🇦🇨',
  },
  {
    name: 'Tristan da Cunha',
    code: 'TA',
    code3: 'TAA',
    dialCode: '+290',
    flag: '🇹🇦',
  },
  {
    name: 'Papua New Guinea',
    code: 'PG',
    code3: 'PNG',
    dialCode: '+675',
    flag: '🇵🇬',
  },
  {
    name: 'Fiji',
    code: 'FJ',
    code3: 'FJI',
    dialCode: '+679',
    flag: '🇫🇯',
  },
  {
    name: 'Solomon Islands',
    code: 'SB',
    code3: 'SLB',
    dialCode: '+677',
    flag: '🇸🇧',
  },
  {
    name: 'Vanuatu',
    code: 'VU',
    code3: 'VUT',
    dialCode: '+678',
    flag: '🇻🇺',
  },
  {
    name: 'New Caledonia',
    code: 'NC',
    code3: 'NCL',
    dialCode: '+687',
    flag: '🇳🇨',
  },
  {
    name: 'French Polynesia',
    code: 'PF',
    code3: 'PYF',
    dialCode: '+689',
    flag: '🇵🇫',
  },
  {
    name: 'Samoa',
    code: 'WS',
    code3: 'WSM',
    dialCode: '+685',
    flag: '🇼🇸',
  },
  {
    name: 'Tonga',
    code: 'TO',
    code3: 'TON',
    dialCode: '+676',
    flag: '🇹🇴',
  },
  {
    name: 'Kiribati',
    code: 'KI',
    code3: 'KIR',
    dialCode: '+686',
    flag: '🇰🇮',
  },
  {
    name: 'Tuvalu',
    code: 'TV',
    code3: 'TUV',
    dialCode: '+688',
    flag: '🇹🇻',
  },
  {
    name: 'Nauru',
    code: 'NR',
    code3: 'NRU',
    dialCode: '+674',
    flag: '🇳🇷',
  },
  {
    name: 'Palau',
    code: 'PW',
    code3: 'PLW',
    dialCode: '+680',
    flag: '🇵🇼',
  },
  {
    name: 'Marshall Islands',
    code: 'MH',
    code3: 'MHL',
    dialCode: '+692',
    flag: '🇲🇭',
  },
  {
    name: 'Micronesia',
    code: 'FM',
    code3: 'FSM',
    dialCode: '+691',
    flag: '🇫🇲',
  },
  {
    name: 'Guam',
    code: 'GU',
    code3: 'GUM',
    dialCode: '+1',
    flag: '🇬🇺',
  },
  {
    name: 'Northern Mariana Islands',
    code: 'MP',
    code3: 'MNP',
    dialCode: '+1',
    flag: '🇲🇵',
  },
  {
    name: 'American Samoa',
    code: 'AS',
    code3: 'ASM',
    dialCode: '+1',
    flag: '🇦🇸',
  },
  {
    name: 'Cook Islands',
    code: 'CK',
    code3: 'COK',
    dialCode: '+682',
    flag: '🇨🇰',
  },
  {
    name: 'Niue',
    code: 'NU',
    code3: 'NIU',
    dialCode: '+683',
    flag: '🇳🇺',
  },
  {
    name: 'Tokelau',
    code: 'TK',
    code3: 'TKL',
    dialCode: '+690',
    flag: '🇹🇰',
  },
  {
    name: 'Wallis and Futuna',
    code: 'WF',
    code3: 'WLF',
    dialCode: '+681',
    flag: '🇼🇫',
  },
  {
    name: 'Pitcairn Islands',
    code: 'PN',
    code3: 'PCN',
    dialCode: '+64',
    flag: '🇵🇳',
  },
  {
    name: 'Norfolk Island',
    code: 'NF',
    code3: 'NFK',
    dialCode: '+672',
    flag: '🇳🇫',
  },
  {
    name: 'Christmas Island',
    code: 'CX',
    code3: 'CXR',
    dialCode: '+61',
    flag: '🇨🇽',
  },
  {
    name: 'Cocos (Keeling) Islands',
    code: 'CC',
    code3: 'CCK',
    dialCode: '+61',
    flag: '🇨🇨',
  },
  {
    name: 'Heard Island and McDonald Islands',
    code: 'HM',
    code3: 'HMD',
    dialCode: '+672',
    flag: '🇭🇲',
  },
  {
    name: 'Bouvet Island',
    code: 'BV',
    code3: 'BVT',
    dialCode: '+47',
    flag: '🇧🇻',
  },
  {
    name: 'Svalbard and Jan Mayen',
    code: 'SJ',
    code3: 'SJM',
    dialCode: '+47',
    flag: '🇸🇯',
  },
  {
    name: 'Åland Islands',
    code: 'AX',
    code3: 'ALA',
    dialCode: '+358',
    flag: '🇦🇽',
  },
  {
    name: 'Isle of Man',
    code: 'IM',
    code3: 'IMN',
    dialCode: '+44',
    flag: '🇮🇲',
  },
  {
    name: 'Jersey',
    code: 'JE',
    code3: 'JEY',
    dialCode: '+44',
    flag: '🇯🇪',
  },
  {
    name: 'Guernsey',
    code: 'GG',
    code3: 'GGY',
    dialCode: '+44',
    flag: '🇬🇬',
  },
];

/**
 * Get all countries sorted by name
 */
export function getAllCountries(): Country[] {
  return [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get countries sorted by priority (if set) then by name
 */
export function getPrioritizedCountries(): Country[] {
  return [...COUNTRIES].sort((a, b) => {
    if (a.priority && b.priority) {
      return a.priority - b.priority;
    }
    if (a.priority) return -1;
    if (b.priority) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Find a country by its ISO 3166-1 alpha-2 code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code.toUpperCase());
}

/**
 * Find a country by its dialing code
 */
export function getCountryByDialCode(dialCode: string): Country[] {
  const normalizedDialCode = dialCode.replace(/\D/g, '');
  return COUNTRIES.filter((country) =>
    country.dialCode.replace(/\D/g, '') === normalizedDialCode
  );
}

/**
 * Search countries by name
 */
export function searchCountries(query: string): Country[] {
  const normalizedQuery = query.toLowerCase().trim();
  return COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(normalizedQuery) ||
      country.code.toLowerCase().includes(normalizedQuery) ||
      country.code3.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get unique dialing codes
 */
export function getUniqueDialCodes(): string[] {
  const uniqueCodes = new Set(COUNTRIES.map((country) => country.dialCode));
  return Array.from(uniqueCodes).sort();
}

/**
 * Format phone number with country code
 */
export function formatPhoneNumber(
  phoneNumber: string,
  countryCode: string
): string {
  const country = getCountryByCode(countryCode);
  if (!country) return phoneNumber;

  const cleaned = phoneNumber.replace(/\D/g, '');
  const dialCode = country.dialCode.replace(/\D/g, '');

  if (cleaned.startsWith(dialCode)) {
    return `+${cleaned}`;
  }

  return `${country.dialCode} ${cleaned}`;
}

/**
 * Validate if a phone number matches a country's format
 */
export function validatePhoneNumber(
  phoneNumber: string,
  countryCode: string
): boolean {
  const country = getCountryByCode(countryCode);
  if (!country) return false;

  const cleaned = phoneNumber.replace(/\D/g, '');
  const dialCode = country.dialCode.replace(/\D/g, '');

  if (cleaned.startsWith(dialCode)) {
    const nationalNumber = cleaned.slice(dialCode.length);
    return nationalNumber.length >= 7 && nationalNumber.length <= 15;
  }

  return cleaned.length >= 7 && cleaned.length <= 15;
}
