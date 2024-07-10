export type login = {
  email: string;
  password: string;
  verifyToken: string;
  first_name: string;
  last_name: string;
};

export type PasswordHash = {
  success: boolean;
  password: string;
};

export type forgotpass = {
  current_password: string;
  new_password: string;
  email: string;
};

export type Interest = {
  [index: number]: { name: string };
};

export type Gender = {
  [index: number]: { name: string };
};

export type Sports = {
  [index: number]: { name: string };
};

export type GetallUser = {
  page: string;
  size: string;
  status: "active" | "inactive";
  searchValue: string;
};

export type GetAllAnnouncements = {
  page: string;
  size: string;
  status: "active" | "inactive";
  searchValue: string;
};

export type GetallReportedUser = {
  page: string;
  searchValue: string;
  limit: string;
};
export type getUserData = {
  id: string;
};
