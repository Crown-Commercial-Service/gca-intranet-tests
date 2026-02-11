import Chance from "chance";

const chance = new Chance();

export type UserRole =
  | "administrator"
  | "editor"
  | "author"
  | "contributor"
  | "subscriber";

export type UserProps = {
  username: string;
  password: string;
  email: string;
  role: UserRole;
};

export default class User {
  readonly username: string;
  readonly password: string;
  readonly email: string;
  readonly role: UserRole;

  constructor(props: UserProps) {
    this.username = props.username;
    this.password = props.password;
    this.email = props.email;
    this.role = props.role;
  }

  static aUser(): UserBuilder {
    return new UserBuilder();
  }

  static anAdmin(): UserBuilder {
    return new UserBuilder().withRole("administrator");
  }

  static anEditor(): UserBuilder {
    return new UserBuilder().withRole("editor");
  }

  static anAuthor(): UserBuilder {
    return new UserBuilder().withRole("author");
  }

  static aSubscriber(): UserBuilder {
    return new UserBuilder().withRole("subscriber");
  }
}

class UserBuilder {
  private props: UserProps = {
    username: `pw_test_user_${chance.string({ length: 6, pool: "abcdefghijklmnopqrstuvwxyz" })}`,
    password: "Passw0rd1!",
    email: `${chance.string({ length: 6, pool: "abcdefghijklmnopqrstuvwxyz" })}@example.com`,
    role: "administrator",
  };

  withUsername(username: string): this {
    this.props.username = username;
    return this;
  }

  withPassword(password: string): this {
    this.props.password = password;
    return this;
  }

  withEmail(email: string): this {
    this.props.email = email;
    return this;
  }

  withRole(role: UserRole): this {
    this.props.role = role;
    return this;
  }

  build(): User {
    return new User(this.props);
  }

  toJSON(): UserProps {
    return this.props;
  }

  valueOf(): User {
    return this.build();
  }

  get username() {
    return this.props.username;
  }
  get password() {
    return this.props.password;
  }
  get email() {
    return this.props.email;
  }
  get role() {
    return this.props.role;
  }
}
