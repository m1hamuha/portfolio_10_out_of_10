export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  org_id: string;
}

export interface JwtUser {
  id: string;
  email: string;
  role: string;
  org_id: string;
}
