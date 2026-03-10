import Post from "./Post";

export default class MenuPages {
  static all(): Post[] {
    return [
      Post.aPage().withFixedTitle("Parent Nav Link 1").withStatus("publish"),

      Post.aPage().withFixedTitle("Child nav link 1").withStatus("publish"),
      Post.aPage().withFixedTitle("Child nav link 2").withStatus("publish"),
      Post.aPage().withFixedTitle("Child nav link 3").withStatus("publish"),
      Post.aPage().withFixedTitle("Child nav link 4").withStatus("publish"),
      Post.aPage().withFixedTitle("Child nav link 5").withStatus("publish"),
      Post.aPage().withFixedTitle("Child nav link 6").withStatus("publish"),
      Post.aPage().withFixedTitle("Child nav link 7").withStatus("publish"),
    ];
  }

  static menu() {
    return [
      {
        parent: "Parent Nav Link 1",
        children: [
          "Child nav link 1",
          "Child nav link 2",
          "Child nav link 3",
          "Child nav link 4",
          "Child nav link 5",
          "Child nav link 6",
          "Child nav link 7",
        ],
      },
    ];
  }
}
