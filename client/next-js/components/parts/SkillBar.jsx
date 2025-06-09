import './SkillBar.css';

export const SkillBar = () => {

    return (
        <div id="skills-bar">
            <div className="skill-button">
                <div className="skill-icon" style={{backgroundImage: "url('/icons/fireball.png')"}}></div>
                <div className="skill-key" id="fireball-cooldown">E</div>
            </div>
            <div className="skill-button">
                <div className="skill-icon" style={{backgroundImage: "url('/icons/spell_frostbolt.jpg')"}}></div>
                <div className="skill-key" id="icebolt-cooldown">R</div>
            </div>
            <div className="skill-button">
                <div className="skill-icon" style={{backgroundImage: "url('/icons/shield.png')"}}></div>
                <div className="skill-key" id="icebolt-cooldown">Q</div>
            </div>
            <div className="skill-button">
                <div className="skill-icon" style={{backgroundImage: "url('/icons/spell_veins.jpg')"}}></div>
                <div className="skill-key" id="ice-veins">F</div>
            </div>
            {/*<div className="skill-button">*/}
            {/*    <div className="skill-icon" style={{backgroundImage: "url('/icons/spell_fire_sealoffire.jpg')"}}></div>*/}
            {/*    <div className="skill-key" id="heal-cooldown">F</div>*/}
            {/*</div>*/}
        </div>

    )
}