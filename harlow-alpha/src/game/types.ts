export type Player = {
    name: string;

    courage: number;
    intelligence: number;
    charisma: number;
    athletics: number;
    strength: number;

    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;

    fear: number;

    money: number;

    inventory: string[];
};

export type GameState = {
    dayNumber: number;
    dayOfWeek: DayOfWeek;
    currentMonth: Month;
    time: number;
    location: Location;
    weather: Weather;


}

export type DayOfWeek =
"Monday" |
"Tuesday" |
"Wednesday" |
"Thursday" |
"Friday" |
"Saturday" |
"Sunday";

export type Location =
"Home" |
"Living room"|
"Kitchen" |
"Bathroom" |
"Ethan's room"|
"Attic" |
"Basement" |
"Garage" |
"Mom's room" |
"Emily's room" |
"Needle & Groove" |
"Corner store" |
"Bar" |
"Park" |
"Police Station" |
"Police Station Inside" |
"Sheriff's office" |
"Home front yard"|
"Home back yard"|
"Cementary"|
"Gas Station" |
"Gas Station Inside" |
"Hospital" |
"Bus Stop" |
"Diner" |
"Motel" |
"Scrapyard";

export type Weather =
"Sunny" |
"Rainy" |
"Cloudy" |
"Thunderstorm" |
"Heavy rain";

export type Month =
"January" |
"February" |
"March" |
"April" |
"May" |
"June" |
"July" |
"August" |
"September" |
"October" |
"November" |
"December"
