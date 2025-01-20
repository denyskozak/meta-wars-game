import './SkillBar.css';

export const SkillBar = () => {

    return (
        <div id="skills-bar">
            <div className="skill-button">
                <div className="skill-icon" style={{backgroundImage: "url('/icons/fireball.png')"}}></div>
                <div className="skill-key" id="fireball-cooldown">E</div>
            </div>
            <div className="skill-button">
                <div className="skill-icon" style={{backgroundImage: "url('/icons/shield.png')"}}></div>
                <div className="skill-key" id="icebolt-cooldown">Q</div>
            </div>
            <div className="skill-button">
                <div className="skill-icon" style={{backgroundImage: "url('/icons/heal.jpeg')"}}></div>
                <div className="skill-key" id="heal-cooldown">F</div>
            </div>
        </div>

    )
}