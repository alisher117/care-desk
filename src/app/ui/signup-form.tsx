'use client'

import { signup } from "../actions/auth"
import { useActionState } from "react"

export default function SignupForm(){
    const [state, action, pending] = useActionState(signup, undefined)
    return (
        <form action={action}>
            <div>
                <label htmlFor="name">Name</label>
                <input id="name" placeholder="Name" name="name" />
            </div>
            {state?.errors?.name && <p>{state.errors.name}</p>}

            <div>
                <label htmlFor="email">Email</label>
                <input type="email" name="email" id="email" placeholder="Email" />
            </div>
            {state?.errors?.email && <p>{state.errors.email}</p>}

            <div>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" name="password" placeholder="Password" />
            </div>
            {state?.errors?.password && (
                <div>
                    <p>Password must:</p>
                    <ul>
                        {state.errors.password.map((error) => (
                            <li key={error}>- {error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <button disabled={pending} type="submit">
                Sign up
            </button>
        </form>
    )
}