import {createContext, DispatchWithoutAction, useContext, useEffect, useReducer} from "react";

export const InterfaceContext = createContext(undefined);

export const initInterfaceState = {
    chatMessages: [],
    character: null,
    scoreboardData: [],
    scoreboardVisible: false,
    statsVisible: false,
    menuVisible: false,
    buffs: [],
    debuffs: [],
};

export const interfaceReducer = (state, action) => {
    switch (action.type) {
        case 'SEND_CHAT_MESSAGE': {
            const chatMessages = [...state.chatMessages, { text: action.payload, id: Date.now()}];
            if (chatMessages.length > 4) {
                chatMessages.shift();
            }
            return {...state, chatMessages};
        }
        case 'SET_CHARACTER': {
            return {...state, character: action.payload};
        }
        case 'SET_SCOREBOARD_DATA': {
            return {...state, scoreboardData: action.payload};
        }
        case 'SET_SCOREBOARD_VISIBLE': {
            return {...state, scoreboardVisible: action.payload};
        }
        case 'SET_STATS_VISIBLE': {
            return {...state, statsVisible: action.payload};
        }
        case 'SET_MENU_VISIBLE': {
            return {...state, menuVisible: action.payload};
        }
        case 'SET_BUFFS': {
            return {...state, buffs: action.payload};
        }
        case 'SET_DEBUFFS': {
            return {...state, debuffs: action.payload};
        }
        default:
            return {...state};
    }
};

const STORAGE_KEY = "MT_Interface";

export const loadStateFromSession = (initialZKLoginState) => {
    const storedState = localStorage.getItem(STORAGE_KEY);
    return storedState ? JSON.parse(storedState) : initialZKLoginState;
};

export const saveStateToSession = (state) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const borrowInitState = () => {
    const sessionState = loadStateFromSession(initInterfaceState);
    return {...sessionState, userSalt: localStorage.getItem("userSalt"), chatMessages: []};
}

export const InterfaceProvider = ({children}) => {
    const [state, dispatch] = useReducer(interfaceReducer, initInterfaceState);

    // Save state to sessionStorage on every update
    // useEffect(() => {
    //     saveStateToSession(state);
    // }, [state]);

    return (
        <InterfaceContext.Provider value={{state, dispatch}}>
            {children}
        </InterfaceContext.Provider>
    );
};

export const useInterface = () => {
    const context =  useContext(InterfaceContext);
    if (!context) throw new Error('InterfaceContext not provided');
    return context;
}