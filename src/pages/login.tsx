import { useState } from 'react';

export default function Login() {
  const [email] = useState('admin@example.com');
  const [password] = useState('password123');
  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <p>This is just a placeholder page so the build succeeds.</p>
    </div>
  );
}
