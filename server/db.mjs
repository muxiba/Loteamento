let pool;
export async function getPool() {
 if (!pool) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
  const {Pool}=await import('pg');
  pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});
  if (process.env.VERCEL) {const {attachDatabasePool}=await import('@vercel/functions');attachDatabasePool(pool);}
 }
 return pool;
}
export async function query(text, values=[]) { return (await getPool()).query(text,values); }
export async function transaction(action) {
 const client=await (await getPool()).connect();
 try {await client.query('BEGIN');const result=await action(client);await client.query('COMMIT');return result;}
 catch(error){await client.query('ROLLBACK');throw error;} finally {client.release();}
}
