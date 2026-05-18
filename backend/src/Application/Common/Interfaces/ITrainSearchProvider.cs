using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Common.Interfaces;

public interface ITrainSearchProvider
{
    (List<TrainDto> Items, int Total) Search(TrainSearchRequest request);
}
