import style from './style.module.css';
function User({nom , prenom , age , children}){
    
    return (
        <div>
            <h1 className = {style.title}>Bonjour je m'appelle{ nom + prenom}</h1>
            <p>mon age est {age} ans</p>
            <div>
                {children}
            </div>
        </div>
    )
}
export default User;