// Single SQL round-trip using IN(...) under the hood.
// Complies with Creedengo GCI1.
public List<UserDto> hydrate(List<Integer> userIds) {
    return userRepository.findAllById(userIds).stream()
            .map(this::toDto)
            .toList();
}

