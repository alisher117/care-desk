import { signup } from "../actions/auth";

export function SignupForm() {
    return (
        <form action={signup}>
            <div>
                <label htmlFor="name">Name</label>
                <input name="name" id="name" placeholder="Name" />
            </div>

            <div>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Email" />
            </div>

            <div>
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" />
            </div>
            <button type="submit">Sign up</button>
        </form>
    )
}