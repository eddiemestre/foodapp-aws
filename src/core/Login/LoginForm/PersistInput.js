import useLocalStorage from "./useLocalStorage";

// for persisting input
// used for keeping the user's email autopopulated in localstorage
const useInput = (key, initValue) => {
    const [value, setValue] = useLocalStorage(key, initValue)

    const reset = () => setValue(initValue);

    const attributeObj = {
        value,
        onChange: (e) => setValue(e.target.value)
    }

    return [value, reset, attributeObj]
}

export default useInput;