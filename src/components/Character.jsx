import {useState} from 'react';
import {useZKLogin} from "react-sui-zk-login-kit";
import {useSuiClientQuery} from '@mysten/dapp-kit';
import {useTransaction} from "../hooks/useTransaction.js";


const PACKAGE_ID = '0x79288216db99425043ee2b4caae337a16f4c6f8ac73454806fd52b2fc861cd88';
export const CharacterManager = ({onCharacterSelect}) => {
    const {address, executeTransaction} = useZKLogin();

    console.log('address ', address)

    const [name, setName] = useState('');
    const [charClass, setCharClass] = useState('');
    const {createNewCharacter, removeCharacter} = useTransaction(PACKAGE_ID);

    const {data, refetch} = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: address,
            limit: 10,
            filter: {
                MatchAll: [
                    {
                        StructType: `${PACKAGE_ID}::character::Character`,
                    },
                ],
            },
            options: {
                showContent: true,
            },
        },
        {queryKey: ['Object']},
    );

    const handleCreateCharacter = async () => {
        await executeTransaction(createNewCharacter(name, charClass));
        await refetch();
    };

    const handleRemoveCharacter = async (id) => {
        await executeTransaction(removeCharacter(id));
        await refetch()
    };

    return (
        <div style={{padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
            <h2>Characters</h2>
            <button onClick={() => {
                refetch()
            }}>refetch
            </button>
            <div>
                {((data && data.data) || []).map(({data: {objectId, content: {fields}}}, index) => (
                    <div key={objectId}>
                        name: {fields.name},
                        class: {fields.class},
                        <button onClick={() => {
                            handleRemoveCharacter(objectId)
                        }}>delete
                        </button>
                        <button onClick={() => {
                            onCharacterSelect(fields)
                        }}>login
                        </button>
                    </div>
                ))}
            </div>
            <br/>
            <h2>Character Manager</h2>

            <div>
                <h3>Create Character</h3>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{marginBottom: '10px', display: 'block'}}
                />
                <select
                    value={charClass}
                    onChange={(e) => setCharClass(e.target.value)}
                    style={{marginBottom: '10px', display: 'block'}}
                >
                    <option value="" disabled>
                        Select Class
                    </option>
                    <option value="warrior">Warrior</option>
                    <option value="mage">Mage</option>
                    <option value="archer">Archer</option>
                    <option value="rogue">Rogue</option>
                </select>
                <button onClick={handleCreateCharacter}>Create Character</button>
            </div>
        </div>
    );
};

export default CharacterManager;
