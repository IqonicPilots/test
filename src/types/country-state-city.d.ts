declare module 'country-state-city' {
  import { ICountry, IState, ICity } from 'country-state-city/lib/interface';
  
  export { ICountry, IState, ICity };

  export const Country: {
    getAllCountries: () => ICountry[];
    getCountryByCode: (isoCode: string) => ICountry | undefined;
  };

  export const State: {
    getAllStates: () => IState[];
    getStatesOfCountry: (countryCode: string) => IState[];
    getStateByCodeAndCountry: (stateCode: string, countryCode: string) => IState | undefined;
  };

  export const City: {
    getAllCities: () => ICity[];
    getCitiesOfState: (countryCode: string, stateCode: string) => ICity[];
    getCitiesOfCountry: (countryCode: string) => ICity[];
  };
}
