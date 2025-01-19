import {createContext, useContext, useEffect, useReducer} from "react";

export const InterfaceContext = createContext(undefined);

export const initInterfaceState = {
    chatMessages: [],
    character: null,
};

export const interfaceReducer = (state, action) => {
    switch (action.type) {
        case 'SEND_CHAT_MESSAGE': {
            const chatMessages = [...state.chatMessages, action.payload];
            if (chatMessages.length > 4) {
                chatMessages.shift();
            }
            console.log('chatMessages ', chatMessages)
            return {...state, chatMessages};
        }
        case 'SET_CHARACTER': {
            return {...state, character: action.payload};
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
    return {...sessionState, userSalt: localStorage.getItem("userSalt")};
}

export const InterfaceProvider = ({children}) => {
    const [state, dispatch] = useReducer(interfaceReducer, initInterfaceState, borrowInitState);

    // Save state to sessionStorage on every update
    useEffect(() => {
        saveStateToSession(state);
    }, [state]);

    return (
        <InterfaceContext.Provider value={{state, dispatch}}>
            {children}
        </InterfaceContext.Provider>
    );
};

export const useInterface = () => {
    return useContext(InterfaceContext);
}