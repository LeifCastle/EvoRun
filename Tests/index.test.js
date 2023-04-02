describe("Player Class", function () {
  const test = new Player("", 5, 5);
  it("the x-position rendered should be a number", function () {
    expect(typeof test.x).toBe("number");
  });
  it("the y-position rendered should be a number", function () {
    expect(typeof test.y).toBe("number");
  });
});
