// Anti-pattern: one SQL round-trip per element → O(N) network calls.
// Detected by Creedengo GCI1.
public List<UserDto> hydrate(List<Integer> userIds) {
    List<UserDto> result = new ArrayList<>();
    for (Integer id : userIds) {
        User u = userRepository.findById(id).orElseThrow();
        result.add(toDto(u));
    }
    return result;
}

